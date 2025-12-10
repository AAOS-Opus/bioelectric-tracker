import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Product, ProductUsage } from '@/models/schema';
import { isTestMode } from '@/lib/test-mode';

/**
 * ProductWithUsage interface matching the hook expectation
 */
interface ProductWithUsage {
  _id: string;
  name: string;
  category: string;
  description: string;
  dosageInstructions: string;
  frequency: string;
  phaseNumbers: number[];
  usage: {
    todayCompleted: boolean;
    weeklyCompletions: number;
    monthlyCompletions: number;
    lastCompletedDate?: string;
    streakDays: number;
  };
}

/**
 * Creates mock product data for all phases
 * Used when TEST_MODE is enabled or MongoDB connection fails
 */
function createMockProducts(): ProductWithUsage[] {
  return [
    {
      _id: 'mock-product-1',
      name: 'PushCatch Liver Detox',
      category: 'Detox',
      description: 'Advanced liver detoxification support formula',
      dosageInstructions: 'Take 2 capsules with morning meal',
      frequency: 'Daily',
      phaseNumbers: [1, 2],
      usage: {
        todayCompleted: false,
        weeklyCompletions: 5,
        monthlyCompletions: 22,
        lastCompletedDate: '2025-09-22',
        streakDays: 3
      }
    },
    {
      _id: 'mock-product-2',
      name: 'Liposomal Glutathione',
      category: 'Detox',
      description: 'Master antioxidant for cellular protection',
      dosageInstructions: 'Take 1 capsule on empty stomach',
      frequency: 'Daily',
      phaseNumbers: [1, 2, 3],
      usage: {
        todayCompleted: true,
        weeklyCompletions: 7,
        monthlyCompletions: 28,
        lastCompletedDate: '2025-12-10',
        streakDays: 7
      }
    },
    {
      _id: 'mock-product-3',
      name: 'MitoQ',
      category: 'Mitochondrial',
      description: 'Mitochondrial support for cellular energy production',
      dosageInstructions: 'Take 1 capsule in the morning',
      frequency: 'Daily',
      phaseNumbers: [2, 3, 4],
      usage: {
        todayCompleted: false,
        weeklyCompletions: 4,
        monthlyCompletions: 18,
        lastCompletedDate: '2025-12-09',
        streakDays: 2
      }
    },
    {
      _id: 'mock-product-4',
      name: 'NAD+ Precursor',
      category: 'Mitochondrial',
      description: 'Supports cellular energy and repair mechanisms',
      dosageInstructions: 'Take 1-2 capsules daily',
      frequency: 'Daily',
      phaseNumbers: [3, 4],
      usage: {
        todayCompleted: false,
        weeklyCompletions: 0,
        monthlyCompletions: 0,
        streakDays: 0
      }
    },
    {
      _id: 'mock-product-5',
      name: 'Binders Complex',
      category: 'Detox',
      description: 'Toxin binding formula for safe elimination',
      dosageInstructions: 'Take 2 capsules away from food/supplements',
      frequency: 'Twice daily',
      phaseNumbers: [1, 2, 3, 4],
      usage: {
        todayCompleted: true,
        weeklyCompletions: 6,
        monthlyCompletions: 25,
        lastCompletedDate: '2025-12-10',
        streakDays: 5
      }
    },
    {
      _id: 'mock-product-6',
      name: 'Electrolyte Complex',
      category: 'Other',
      description: 'Essential minerals for bioelectric balance',
      dosageInstructions: 'Add to water throughout the day',
      frequency: 'Daily',
      phaseNumbers: [1, 2, 3, 4],
      usage: {
        todayCompleted: true,
        weeklyCompletions: 7,
        monthlyCompletions: 30,
        lastCompletedDate: '2025-12-10',
        streakDays: 14
      }
    }
  ];
}

/**
 * GET /api/products - Fetch all products with usage data
 * Supports optional phase filter: GET /api/products?phase=1
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const phaseFilter = searchParams.get('phase');

    // 1. Check if TEST_MODE is enabled
    if (isTestMode()) {
      console.log('TEST_MODE enabled - returning mock products data');
      let products = createMockProducts();

      // Apply phase filter if provided
      if (phaseFilter) {
        const phaseNum = parseInt(phaseFilter, 10);
        if (!isNaN(phaseNum) && phaseNum >= 1 && phaseNum <= 4) {
          products = products.filter(p => p.phaseNumbers.includes(phaseNum));
        }
      }

      return NextResponse.json(products);
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 3. Database connection with fallback
    try {
      await connectDB();
    } catch (dbError) {
      console.error('MongoDB connection failed, falling back to mock data:', dbError);
      let products = createMockProducts();
      if (phaseFilter) {
        const phaseNum = parseInt(phaseFilter, 10);
        if (!isNaN(phaseNum)) {
          products = products.filter(p => p.phaseNumbers.includes(phaseNum));
        }
      }
      return NextResponse.json(products);
    }

    // 4. Build query
    const query: Record<string, any> = {};
    if (phaseFilter) {
      const phaseNum = parseInt(phaseFilter, 10);
      if (!isNaN(phaseNum) && phaseNum >= 1 && phaseNum <= 4) {
        query.phaseNumbers = phaseNum;
      }
    }

    // 5. Fetch products
    const products = await Product.find(query).lean();

    // 6. If no products in DB, return mock data
    if (!products || products.length === 0) {
      console.log('No products in database, returning mock data');
      let mockProducts = createMockProducts();
      if (phaseFilter) {
        const phaseNum = parseInt(phaseFilter, 10);
        if (!isNaN(phaseNum)) {
          mockProducts = mockProducts.filter(p => p.phaseNumbers.includes(phaseNum));
        }
      }
      return NextResponse.json(mockProducts);
    }

    // 7. Get user's usage data for each product
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Fetch usage records for user
    const usageRecords = await ProductUsage.find({
      userId: session.user.id,
      date: { $gte: monthAgo }
    }).lean();

    // 8. Map products with usage data
    const productsWithUsage: ProductWithUsage[] = products.map((product: any) => {
      const productUsage = usageRecords.filter(
        (u: any) => u.productId?.toString() === product._id.toString()
      );

      // Calculate usage stats
      const todayRecord = productUsage.find(
        (u: any) => new Date(u.date).toDateString() === today.toDateString()
      );

      const weeklyCompletions = productUsage.filter(
        (u: any) => new Date(u.date) >= weekAgo && u.isCompleted
      ).length;

      const monthlyCompletions = productUsage.filter(
        (u: any) => u.isCompleted
      ).length;

      // Calculate streak (simplified - counts consecutive days)
      let streakDays = 0;
      const sortedUsage = productUsage
        .filter((u: any) => u.isCompleted)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (sortedUsage.length > 0) {
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const usage of sortedUsage) {
          const usageDate = new Date(usage.date);
          usageDate.setHours(0, 0, 0, 0);

          const diffDays = Math.floor((currentDate.getTime() - usageDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays <= 1) {
            streakDays++;
            currentDate = usageDate;
          } else {
            break;
          }
        }
      }

      const lastCompleted = sortedUsage[0];

      return {
        _id: product._id.toString(),
        name: product.name,
        category: product.category,
        description: product.description,
        dosageInstructions: product.dosageInstructions,
        frequency: product.frequency,
        phaseNumbers: product.phaseNumbers,
        usage: {
          todayCompleted: !!todayRecord?.isCompleted,
          weeklyCompletions,
          monthlyCompletions,
          lastCompletedDate: lastCompleted ? new Date(lastCompleted.date).toISOString().split('T')[0] : undefined,
          streakDays
        }
      };
    });

    console.log(`Returning ${productsWithUsage.length} products for user ${session.user.email}`);

    return NextResponse.json(productsWithUsage);

  } catch (error) {
    console.error('Error in products API:', error);

    // Final fallback
    let products = createMockProducts();
    const phaseFilter = new URL(request.url).searchParams.get('phase');
    if (phaseFilter) {
      const phaseNum = parseInt(phaseFilter, 10);
      if (!isNaN(phaseNum)) {
        products = products.filter(p => p.phaseNumbers.includes(phaseNum));
      }
    }

    return NextResponse.json(products);
  }
}

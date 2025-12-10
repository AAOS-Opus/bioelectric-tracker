import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { UserProvider } from '@/hooks/useUser';
import ProgressJournal from '@/components/progress/ProgressJournal';
import JournalEntryList from '@/components/progress/journal/JournalEntryList';
import JournalSearch from '@/components/progress/journal/JournalSearch';
import JournalEntryView from '@/components/progress/journal/JournalEntryView';
import { JournalEntry, Emotion } from '@/types/journal';
import { encryptEntry, decryptEntry } from '@/lib/encryption';

// Mock the encryption functions
jest.mock('@/lib/encryption', () => ({
  encryptEntry: jest.fn((content) => `encrypted-${content}`),
  decryptEntry: jest.fn((content) => content.replace('encrypted-', '')),
  hashContent: jest.fn((content) => `hash-${content}`),
  generateEncryptionKey: jest.fn(() => 'test-key'),
  storeEncryptionKey: jest.fn(),
  getStoredEncryptionKey: jest.fn(() => 'test-key'),
}));

// Mock the fetch function
global.fetch = jest.fn();

// Mock data for testing
const mockEntries: JournalEntry[] = [
  {
    id: '1',
    title: 'First Journal Entry',
    content: encryptEntry(JSON.stringify({ blocks: [{ text: 'This is my first journal entry content.' }] })),
    date: new Date(2025, 2, 1).toISOString(),
    emotion: 'optimistic',
    tags: ['general', 'phase1'],
    isDraft: false,
    isShared: false,
    createdAt: new Date(2025, 2, 1).toISOString(),
    updatedAt: new Date(2025, 2, 1).toISOString(),
    userId: 'user1'
  },
  {
    id: '2',
    title: 'Second Journal Entry',
    content: encryptEntry(JSON.stringify({ blocks: [{ text: 'This is my second journal entry content.' }] })),
    date: new Date(2025, 2, 15).toISOString(),
    emotion: 'content',
    tags: ['milestone', 'phase1'],
    isDraft: false,
    isShared: true,
    sharedWith: ['practitioner1'],
    createdAt: new Date(2025, 2, 15).toISOString(),
    updatedAt: new Date(2025, 2, 16).toISOString(),
    userId: 'user1'
  },
  {
    id: '3',
    title: 'Draft Entry',
    content: encryptEntry(JSON.stringify({ blocks: [{ text: 'This is a draft entry.' }] })),
    date: new Date(2025, 2, 20).toISOString(),
    emotion: 'neutral',
    tags: ['general'],
    isDraft: true,
    isShared: false,
    createdAt: new Date(2025, 2, 20).toISOString(),
    updatedAt: new Date(2025, 2, 20).toISOString(),
    userId: 'user1'
  }
];

const mockPractitioners = [
  { id: 'practitioner1', name: 'Dr. Smith', email: 'dr.smith@example.com', role: 'practitioner' },
  { id: 'practitioner2', name: 'Dr. Johnson', email: 'dr.johnson@example.com', role: 'practitioner' }
];

const mockUser = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  programStartDate: new Date(2025, 1, 1).toISOString(),
  currentPhaseId: 'phase1',
  createdAt: new Date(2025, 1, 1).toISOString(),
  updatedAt: new Date(2025, 1, 1).toISOString(),
};

const mockPhases = [
  {
    _id: 'phase1',
    phaseNumber: 1,
    name: 'Detox Phase',
    description: 'Initial detoxification phase',
    startDate: new Date(2025, 1, 1).toISOString(),
    endDate: new Date(2025, 2, 1).toISOString(),
    affirmation: 'I am cleansing my body of toxins',
    isCompleted: true
  },
  {
    _id: 'phase2',
    phaseNumber: 2,
    name: 'Regeneration Phase',
    description: 'Cellular regeneration phase',
    startDate: new Date(2025, 2, 1).toISOString(),
    endDate: new Date(2025, 3, 1).toISOString(),
    affirmation: 'My cells are regenerating and healing',
    isCompleted: false
  }
];

// Mock the useUser hook
jest.mock('@/hooks/useUser', () => {
  const originalModule = jest.requireActual('@/hooks/useUser');
  
  return {
    ...originalModule,
    useUser: () => ({
      user: mockUser,
      phases: mockPhases,
      loading: false,
      error: null,
      refreshUser: jest.fn(),
      logout: jest.fn(),
      login: jest.fn()
    }),
    UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  };
});

// Mock for Web Speech API
const mockSpeechRecognition = () => {
  // @ts-ignore
  global.SpeechRecognition = jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
  
  // @ts-ignore
  global.webkitSpeechRecognition = global.SpeechRecognition;
};

describe('ProgressJournal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpeechRecognition();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/journal/entries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entries: mockEntries })
        });
      }
      if (url.includes('/api/practitioners')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ practitioners: mockPractitioners })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'journalDraft') {
        return JSON.stringify({
          title: 'Saved Draft',
          content: encryptEntry(JSON.stringify({ blocks: [{ text: 'Autosaved content' }] })),
          emotion: 'joyful',
          tags: ['draft'],
          lastSaved: new Date().toISOString()
        });
      }
      return null;
    });
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders the ProgressJournal component', async () => {
    await act(async () => {
      render(
        <UserProvider>
          <ProgressJournal />
        </UserProvider>
      );
    });

    expect(screen.getByText(/Progress Journal/i)).toBeInTheDocument();
  });

  test('loads journal entries on mount', async () => {
    await act(async () => {
      render(
        <UserProvider>
          <ProgressJournal />
        </UserProvider>
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/journal/entries',
      expect.any(Object)
    );
    
    await waitFor(() => {
      expect(screen.getByText(/First Journal Entry/i)).toBeInTheDocument();
      expect(screen.getByText(/Second Journal Entry/i)).toBeInTheDocument();
    });
  });

  test('creates a new journal entry', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(
        <UserProvider>
          <ProgressJournal />
        </UserProvider>
      );
    });

    // Click new entry button
    const newEntryButton = screen.getByText(/New Entry/i);
    await user.click(newEntryButton);

    // Fill in the form
    const titleInput = screen.getByLabelText(/Title/i);
    await user.type(titleInput, 'Test Journal Entry');

    // Save the entry
    const saveButton = screen.getByText(/Save/i);
    await user.click(saveButton);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/journal/entries',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String)
      })
    );
  });

  test('loads a draft from local storage', async () => {
    await act(async () => {
      render(
        <UserProvider>
          <ProgressJournal />
        </UserProvider>
      );
    });

    // Check if draft is loaded
    expect(localStorage.getItem).toHaveBeenCalledWith('journalDraft');
    
    // Look for the draft recovery notification
    await waitFor(() => {
      expect(screen.getByText(/You have an unsaved draft/i)).toBeInTheDocument();
    });
  });
});

describe('JournalEntryList Component', () => {
  test('renders the journal entries list', () => {
    render(
      <JournalEntryList
        entries={mockEntries}
        onSelectEntry={jest.fn()}
        onDeleteEntry={jest.fn()}
        onShareEntry={jest.fn()}
      />
    );

    expect(screen.getByText('First Journal Entry')).toBeInTheDocument();
    expect(screen.getByText('Second Journal Entry')).toBeInTheDocument();
    expect(screen.getByText('Draft Entry')).toBeInTheDocument();
  });

  test('groups entries by month', () => {
    render(
      <JournalEntryList
        entries={mockEntries}
        onSelectEntry={jest.fn()}
        onDeleteEntry={jest.fn()}
        onShareEntry={jest.fn()}
      />
    );

    expect(screen.getByText('March 2025')).toBeInTheDocument();
  });

  test('handles entry selection', async () => {
    const mockSelectEntry = jest.fn();
    const user = userEvent.setup();
    
    render(
      <JournalEntryList
        entries={mockEntries}
        onSelectEntry={mockSelectEntry}
        onDeleteEntry={jest.fn()}
        onShareEntry={jest.fn()}
      />
    );

    const entryItem = screen.getByText('First Journal Entry');
    await user.click(entryItem);

    expect(mockSelectEntry).toHaveBeenCalledWith('1');
  });

  test('handles entry deletion with confirmation', async () => {
    const mockDeleteEntry = jest.fn();
    const user = userEvent.setup();
    
    render(
      <JournalEntryList
        entries={mockEntries}
        onSelectEntry={jest.fn()}
        onDeleteEntry={mockDeleteEntry}
        onShareEntry={jest.fn()}
      />
    );

    // Find delete buttons
    const deleteButtons = screen.getAllByLabelText('Delete entry');
    await user.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByText('Yes, delete');
    await user.click(confirmButton);

    expect(mockDeleteEntry).toHaveBeenCalledWith('1');
  });
});

describe('JournalSearch Component', () => {
  test('renders the search component', () => {
    render(
      <JournalSearch
        onFilterChange={jest.fn()}
        currentFilter={{ text: '', tags: [], emotions: [], dateRange: null }}
      />
    );

    expect(screen.getByPlaceholderText('Search journal entries...')).toBeInTheDocument();
  });

  test('updates text filter on input change', async () => {
    const mockFilterChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <JournalSearch
        onFilterChange={mockFilterChange}
        currentFilter={{ text: '', tags: [], emotions: [], dateRange: null }}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search journal entries...');
    await user.type(searchInput, 'test');

    expect(mockFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'test' })
    );
  });

  test('opens filter panel on filter button click', async () => {
    const user = userEvent.setup();
    
    render(
      <JournalSearch
        onFilterChange={jest.fn()}
        currentFilter={{ text: '', tags: [], emotions: [], dateRange: null }}
      />
    );

    const filterButton = screen.getByLabelText('Show filters');
    await user.click(filterButton);

    expect(screen.getByText('Filter Entries')).toBeInTheDocument();
  });

  test('selects emotion filters', async () => {
    const mockFilterChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <JournalSearch
        onFilterChange={mockFilterChange}
        currentFilter={{ text: '', tags: [], emotions: [], dateRange: null }}
      />
    );

    // Open filters
    const filterButton = screen.getByLabelText('Show filters');
    await user.click(filterButton);

    // Select an emotion
    const joyfulButton = screen.getByText('joyful');
    await user.click(joyfulButton);

    expect(mockFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ emotions: ['joyful'] })
    );
  });
});

describe('JournalEntryView Component', () => {
  const mockEntry = mockEntries[0];
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnClose = jest.fn();

  test('renders entry view in read mode', () => {
    render(
      <JournalEntryView
        entry={mockEntry}
        practitioners={mockPractitioners}
        availableTags={['general', 'milestone', 'phase1']}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('First Journal Entry')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('switches to edit mode', async () => {
    const user = userEvent.setup();
    
    render(
      <JournalEntryView
        entry={mockEntry}
        practitioners={mockPractitioners}
        availableTags={['general', 'milestone', 'phase1']}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  test('saves edited entry', async () => {
    const user = userEvent.setup();
    
    render(
      <JournalEntryView
        entry={{ ...mockEntry, isDraft: true }}
        practitioners={mockPractitioners}
        availableTags={['general', 'milestone', 'phase1']}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Entry should be in edit mode since it's a draft
    const titleInput = screen.getByLabelText('Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    // Save the entry
    const saveButton = screen.getByText('Save Draft');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Title',
      })
    );
  });

  test('shows share modal', async () => {
    const user = userEvent.setup();
    
    render(
      <JournalEntryView
        entry={mockEntry}
        practitioners={mockPractitioners}
        availableTags={['general', 'milestone', 'phase1']}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const shareButton = screen.getByText('Share');
    await user.click(shareButton);

    expect(screen.getByText('Share with Practitioners')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
  });

  test('handles entry deletion', async () => {
    const user = userEvent.setup();
    
    render(
      <JournalEntryView
        entry={mockEntry}
        practitioners={mockPractitioners}
        availableTags={['general', 'milestone', 'phase1']}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalled();
  });
});

'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface BiomarkerData {
  date: string
  biomarkers: {
    [key: string]: number
  }
}

interface BiomarkerChartProps {
  data: BiomarkerData[]
  biomarkerKey: string
  label: string
}

const chartColors = {
  energyLevel: {
    line: 'rgb(147, 197, 253)',
    background: 'rgba(147, 197, 253, 0.1)'
  },
  sleepQuality: {
    line: 'rgb(110, 231, 183)',
    background: 'rgba(110, 231, 183, 0.1)'
  },
  detoxSymptoms: {
    line: 'rgb(96, 165, 250)',
    background: 'rgba(96, 165, 250, 0.1)'
  }
}

export default function BiomarkerChart({ data, biomarkerKey, label }: BiomarkerChartProps) {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgb(255, 255, 255)',
        titleColor: 'rgb(17, 24, 39)',
        bodyColor: 'rgb(17, 24, 39)',
        borderColor: 'rgb(229, 231, 235)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.parsed.y} / 10`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        min: 0,
        max: 10,
        grid: {
          color: 'rgb(243, 244, 246)'
        },
        ticks: {
          stepSize: 2,
          font: {
            size: 12
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  }

  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }),
    datasets: [
      {
        label,
        data: data.map(d => d.biomarkers[biomarkerKey] || 0),
        borderColor: chartColors[biomarkerKey as keyof typeof chartColors].line,
        backgroundColor: chartColors[biomarkerKey as keyof typeof chartColors].background,
        fill: true,
        borderWidth: 2
      }
    ]
  }

  return (
    <div className="p-4 bg-white rounded-xl">
      <h3 className="text-sm font-medium text-gray-900 mb-4">{label}</h3>
      <div className="h-48">
        <Line options={options} data={chartData} />
      </div>
    </div>
  )
}

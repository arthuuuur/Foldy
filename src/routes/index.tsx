import { createFileRoute } from '@tanstack/react-router'
import {
  Zap,
  FileDown,
  Share2,
  Layers,
  Box,
  Sliders,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const features = [
    {
      icon: <Zap className="w-12 h-12 text-cyan-400" />,
      title: 'Simple and Fast',
      description:
        'Intuitive and fluid interface. Create your folding patterns in just a few clicks, no learning curve required.',
    },
    {
      icon: <Sliders className="w-12 h-12 text-cyan-400" />,
      title: 'Customizable Dimensions',
      description:
        'Precisely adjust your patterns to match your book\'s exact dimensions. Automatic adaptation for perfect results.',
    },
    {
      icon: <Layers className="w-12 h-12 text-cyan-400" />,
      title: 'All Techniques',
      description:
        'Cut & Fold, simple folding, inverted... Access all bookfolding techniques in one place.',
    },
    {
      icon: <Share2 className="w-12 h-12 text-cyan-400" />,
      title: 'Community Sharing',
      description:
        'Create and share your patterns with the community. Discover thousands of public creations.',
    },
    {
      icon: <FileDown className="w-12 h-12 text-cyan-400" />,
      title: 'Multi-Format Export',
      description:
        'Export your patterns as PDF for printing or CSV for processing. Maximum flexibility.',
    },
    {
      icon: (
        <div className="relative">
          <Box className="w-12 h-12 text-cyan-400" />
          <span className="absolute -top-2 -right-2 text-xs bg-cyan-500 text-white px-2 py-0.5 rounded-full">
        Soon
      </span>
        </div>
      ),
      title: '3D Preview',
      description:
        'Visualize your creation in 3D before you start folding. Perfect to anticipate the final result.',
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            {/*<img*/}
            {/*  src="/tanstack-circle-logo.png"*/}
            {/*  alt="TanStack Logo"*/}
            {/*  className="w-24 h-24 md:w-32 md:h-32"*/}
            {/*/>*/}
            <h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em]">
              <span className="text-gray-300">FOLDY</span>{' '}
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Turn any image into a bookfolding pattern
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Upload any image and get professional folding patterns in seconds.
            Automated page calculations, precise measurements, and ready-to-print
            templates for your book art.
          </p>
          <div className="flex flex-col items-center gap-4">
            <a
              href="/generate"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
            >
              Generate Pattern
            </a>
            <p className="text-gray-400 text-sm mt-2">
              Start with one free pattern • Upgrade anytime for unlimited

            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

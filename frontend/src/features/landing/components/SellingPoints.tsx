import { motion } from 'motion/react';
import { ChevronDown, Download } from 'lucide-react';

import { getSlideVariant, titleReveal } from '@lib/motionVariants';
import { useScrollReveal } from '../hooks/useScrollReveal';

const points = [
  {
    badge: 'Positionnement',
    title: 'Adapté à votre univers',
    description:
      'Pas une IA générique — les descriptions sonnent comme un vrai rédacteur de votre niche.',
  },
  {
    badge: 'Performance',
    title: 'SEO-ready dès la génération',
    description:
      'Balises titre, méta-description, mots-clés intégrés automatiquement à chaque fiche.',
  },
  {
    badge: 'Workflow',
    title: 'Export direct PrestaShop & Shopify',
    description: 'CSV prêt à importer, zéro copier-coller, zéro friction.',
  },
];

export function SellingPoints() {
  const { ref: titleRef, inView: titleInView } = useScrollReveal<HTMLHeadingElement>(0.5);

  return (
    <motion.section
      className="py-20 px-4 max-w-5xl mx-auto"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      <motion.h2
        ref={titleRef}
        variants={titleReveal}
        initial="hidden"
        animate={titleInView ? 'visible' : 'hidden'}
        className="text-3xl font-extrabold text-gray-900 mb-16 text-center"
      >
        Pourquoi ficheproduct fait la différence
      </motion.h2>
      <div className="space-y-14 max-w-5xl mx-auto">
        {points.map((point, index) => (
          <article
            key={point.title}
            className={`flex flex-col md:items-center md:gap-10 gap-6 ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}
          >
            <motion.div
              variants={getSlideVariant(index % 2 === 0)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="flex-1"
            >
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">
                {point.badge}
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-4">{point.title}</h3>
              <p className="text-gray-500 leading-relaxed">{point.description}</p>
            </motion.div>
            <motion.div
              variants={getSlideVariant(index % 2 !== 0)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.15 }}
              className="flex-1 bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.06)]"
            >
              {index === 0 && (
                <>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="ml-3 text-xs text-gray-400 font-mono">
                      fiche_kitesurf_storm_v3.txt
                    </span>
                  </div>
                  <div className="p-6 space-y-4 text-sm">
                    <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                          IA générique
                        </span>
                      </div>
                      <p className="text-gray-500 italic text-sm leading-relaxed">
                        "Produit de qualité pour les amateurs de sports nautiques. Idéal pour
                        pratiquer en toute sécurité."
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <ChevronDown size={16} className="text-gray-300" />
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                          ficheproduct
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        "Aile allround 12m², stable vent 16-28 nœuds, relance rapide. Idéale riders
                        intermédiaires cherchant polyvalence freeride & vague."
                      </p>
                    </div>
                  </div>
                </>
              )}

              {index === 1 && (
                <>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="ml-3 text-xs text-gray-400 font-mono">head.html</span>
                  </div>

                  <div className="p-6 space-y-4 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Score SEO
                      </span>
                      <span className="text-2xl font-black text-emerald-500">
                        94<span className="text-sm text-gray-300">/100</span>
                      </span>
                    </div>
                    {[
                      { label: 'Titre optimisé', score: 98, color: 'bg-emerald-400' },
                      { label: 'Méta-description', score: 91, color: 'bg-emerald-400' },
                      { label: 'Mots-clés longue traîne', score: 87, color: 'bg-emerald-400' },
                      { label: 'Densité sémantique', score: 95, color: 'bg-emerald-400' },
                    ].map(({ label, score, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-gray-400 font-mono">{score}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 bg-gray-50 rounded-lg p-3 font-mono text-xs">
                      <span className="text-gray-600">
                        Aile Kitesurf Storm V3 10m² | Freeride & Wave
                      </span>
                    </div>
                  </div>
                </>
              )}

              {index === 2 && (
                <>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="ml-3 text-xs text-gray-400 font-mono">export_shopify.csv</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['handle', 'title', 'tags'].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-2.5 text-purple-500/70 font-semibold uppercase tracking-wider bg-gray-50"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            handle: 'storm-v3-10m2',
                            title: 'Aile Storm V3 10m²',
                            tags: 'freeride · wave',
                          },
                          {
                            handle: 'evo-2024-12m',
                            title: 'Duotone Evo 12m²',
                            tags: 'allwind · débutant',
                          },
                          {
                            handle: 'bandit-9m',
                            title: 'F-One Bandit 9m²',
                            tags: 'freestyle · light wind',
                          },
                        ].map((row) => (
                          <tr
                            key={row.handle}
                            className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-emerald-600 font-mono">{row.handle}</td>
                            <td className="px-4 py-3 text-gray-700">{row.title}</td>
                            <td className="px-4 py-3 text-gray-400">{row.tags}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <span className="text-xs text-gray-400">
                        3 fiches générées · prêtes à importer
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg cursor-default">
                        <Download size={12} />
                        Télécharger CSV
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

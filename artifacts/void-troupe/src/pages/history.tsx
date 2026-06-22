import { useGetAnalyses, type AnalysisSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { History as HistoryIcon, ArrowRight, Loader2, Database } from "lucide-react";
import { format } from "date-fns";

export default function History() {
  const { data, isLoading, error } = useGetAnalyses();
  const analyses = data?.analyses ?? [];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <HistoryIcon className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold">Analysis Records</h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
            <p>Accessing the archives...</p>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 rounded-2xl text-center border-destructive/20 text-destructive">
            <p>Failed to retrieve records. The void is silent.</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="glass-panel p-16 rounded-3xl text-center flex flex-col items-center justify-center">
            <Database className="w-16 h-16 text-muted-foreground/30 mb-6" />
            <h3 className="text-2xl font-bold mb-2">No Records Found</h3>
            <p className="text-muted-foreground mb-8">You haven't submitted any thoughts to the void yet.</p>
            <Link href="/analyze" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform inline-flex items-center gap-2">
              Start Analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {analyses.map((analysis: AnalysisSummary, i: number) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel p-6 rounded-2xl hover:bg-white/[0.04] transition-colors flex flex-col sm:flex-row gap-6 justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                      ID: #{analysis.id}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {format(new Date(analysis.createdAt), "MMM d, yyyy • h:mm a")}
                    </span>
                  </div>
                  <p className="text-white font-medium">
                    {analysis.wordCount} words analyzed
                  </p>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  {Object.entries(analysis.scores as Record<string, number>).map(([trait, score]) => (
                    <div key={trait} className="flex-1 sm:w-16 h-16 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center p-2" title={trait}>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{trait.charAt(0)}</span>
                      <span className="font-mono text-sm text-white font-bold">{Math.round(score)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

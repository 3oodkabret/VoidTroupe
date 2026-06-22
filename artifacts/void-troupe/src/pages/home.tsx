import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Fingerprint, Activity, Heart, ShieldAlert } from "lucide-react";

const TRAITS = [
  {
    id: "openness",
    name: "Openness",
    icon: SparklesIcon,
    color: "text-[hsl(var(--chart-1))]",
    bg: "bg-[hsl(var(--chart-1))]/10",
    desc: "Inventive and curious vs. consistent and cautious. Reflects a degree of intellectual curiosity, creativity and a preference for novelty."
  },
  {
    id: "conscientiousness",
    name: "Conscientiousness",
    icon: Fingerprint,
    color: "text-[hsl(var(--chart-2))]",
    bg: "bg-[hsl(var(--chart-2))]/10",
    desc: "Efficient and organized vs. extravagant and careless. A tendency to be organized and dependable, show self-discipline."
  },
  {
    id: "extraversion",
    name: "Extraversion",
    icon: Activity,
    color: "text-[hsl(var(--chart-3))]",
    bg: "bg-[hsl(var(--chart-3))]/10",
    desc: "Outgoing and energetic vs. solitary and reserved. Energy, positive emotions, surgency, assertiveness, and sociability."
  },
  {
    id: "agreeableness",
    name: "Agreeableness",
    icon: Heart,
    color: "text-[hsl(var(--chart-4))]",
    bg: "bg-[hsl(var(--chart-4))]/10",
    desc: "Friendly and compassionate vs. critical and rational. A tendency to be compassionate and cooperative rather than suspicious."
  },
  {
    id: "neuroticism",
    name: "Neuroticism",
    icon: ShieldAlert,
    color: "text-[hsl(var(--chart-5))]",
    bg: "bg-[hsl(var(--chart-5))]/10",
    desc: "Sensitive and nervous vs. resilient and confident. The tendency to experience psychological stress and negative emotions."
  }
];

function SparklesIcon(props: any) {
  return <Brain {...props} />;
}

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden pt-16">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/cosmic-void-bg.png`} 
          alt="Cosmic Void" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Personality Analysis
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Gaze Into The <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-accent text-glow">
                Void Troupe
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Uncover the depths of your psyche through linguistic analysis. 
              Pour your thoughts into the void, and let our intelligence map your true nature across the Big Five personality dimensions.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                href="/analyze" 
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:box-glow"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Begin Analysis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 relative flex justify-center items-center"
          >
            <div className="absolute w-[120%] h-[120%] bg-primary/20 blur-[120px] rounded-full z-0" />
            <img 
              src={`${import.meta.env.BASE_URL}images/abstract-orb.png`} 
              alt="Mysterious Orb" 
              className="w-full max-w-md relative z-10 animate-float"
              style={{ animation: "float 6s ease-in-out infinite" }}
            />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-32"
        >
          <h2 className="text-3xl font-display font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            The OCEAN Framework
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRAITS.map((trait, i) => (
              <div 
                key={trait.id}
                className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${trait.bg} flex items-center justify-center mb-4`}>
                  <trait.icon className={`w-6 h-6 ${trait.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{trait.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {trait.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Heart, Send, CheckCircle2, ArrowRight, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Standard Shadcn UI toast hook

export default function SourcingPage() {
  const { toast } = useToast();
  const [npoName, setNpoName] = useState('');
  const [npoWebsite, setNpoWebsite] = useState('');
  const [npoEmail, setNpoEmail] = useState('');
  const [npoMission, setNpoMission] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!npoName.trim() || !npoWebsite.trim() || !npoEmail.trim() || !npoMission.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all parameters before submitting.",
        variant: "destructive"
      });
      return;
    }

    // 🛡️ Client-Side Spoofing Protection Gate
    const websiteLower = npoWebsite.trim().toLowerCase();
    const emailLower = npoEmail.trim().toLowerCase();
    const domain = websiteLower.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];
    const isInternalDomain = domain === 'cybrdeck.com' || domain.endsWith('.cybrdeck.com') ||
                             domain === 'evecount.com' || domain.endsWith('.evecount.com');
    const isInternalEmail = emailLower.endsWith('@cybrdeck.com') || emailLower.endsWith('@evecount.com');
    
    if (isInternalDomain && !isInternalEmail) {
      toast({
        title: "Spoofing Protection Active",
        description: "Audits for cybrdeck.com and evecount.com are restricted to verified team members. Please enter your official corporate email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${apiBase}/prospect/npo-debrief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          npo_name: npoName,
          npo_website: npoWebsite,
          npo_mission: npoMission,
          npo_email: npoEmail
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        toast({
          title: "Audit Proposal Submitted",
          description: "Technical proposal compiled successfully and dispatched to your inbox!",
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.detail || "Ethics compliance audit blocked the request.";
        toast({
          title: "Ethics Gate Alert",
          description: errMsg,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Network Error",
        description: "Failed to connect to our RAG backend. Make sure the api is online.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 md:p-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border border-border/80 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Decorative subtle background aura */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        {!submitSuccess ? (
          <div className="space-y-8 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary tracking-wide uppercase">
                <Heart size={12} className="fill-primary" />
                <span>Non-Profit Sourcing Program</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
                Secure RAG Sourcing Portal
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Empowering non-profits with localized, zero-egress RAG architectures. Submit your organization parameters to dynamically generate a customized, secrets-free technology proposal delivered straight to your inbox completely free.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Save the Children" 
                  value={npoName}
                  onChange={(e) => setNpoName(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization Website URL</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. https://savethechildren.org" 
                    value={npoWebsite}
                    onChange={(e) => setNpoWebsite(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Director / Recipient Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. director@savethechildren.org" 
                    value={npoEmail}
                    onChange={(e) => setNpoEmail(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Community Focus & Operational Mission</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="e.g. We coordinate regional healthcare programs, distribute pediatric supplies, and manage local volunteer networks to ensure community wellness." 
                  value={npoMission}
                  onChange={(e) => setNpoMission(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-wider text-xs py-4 rounded-lg shadow-lg hover:shadow-primary/10 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Generating Audit...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Compile RAG Proposal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-10 space-y-6 relative z-10 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <CheckCircle2 size={32} className="stroke-[1.5]" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-bold tracking-tight">Proposal Dispatched!</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Thank you for coordinating with the **cybrdeck Whitehat Sourcing Team**. A customized zero-egress RAG technical architecture proposal has been compiled and emailed directly to **{npoEmail}**.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-background/30 border border-border/50 text-xs text-muted-foreground leading-relaxed flex items-start gap-3 text-left">
              <AlertTriangle size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <span>
                Please check your inbox (including your spam/junk folder) for a message titled **🕵️‍♂️ CYBRDECK RAG TACTICAL BRIEFING** from `one@evecount.com`. To initiate our sandbox demo or claim locked active Objections telemetry logs, simply reply directly to that thread.
              </span>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  setNpoName('');
                  setNpoWebsite('');
                  setNpoEmail('');
                  setNpoMission('');
                  setSubmitSuccess(false);
                }}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline cursor-pointer"
              >
                <span>Request Another Audit</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { SystemSettings } from '@/lib/admin-settings';
import { motion } from 'framer-motion';
import { Instagram, Linkedin, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ContactPage({ settings }: { settings: SystemSettings }) {
  const siteName = settings?.siteName || 'ZenZebra';
  const email = settings?.supportEmail || 'support@zenzebra.in';
  const phone = settings?.supportPhone || '+91 9910605187';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    query: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = formData.phone.replace(/\D/g, '');

    if (!emailRegex.test(formData.email)) {
      return toast.error('Please enter a valid email address');
    }

    if (phoneDigits.length !== 10) {
      return toast.error('Phone number must be exactly 10 digits');
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: phoneDigits, // Send clean digits to API
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', query: '' });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden">
      {/* Background glow - adjusted for light/dark */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[40rem] w-[40rem] rounded-full bg-[#CC2224]/10 dark:bg-[#CC2224]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[36rem] w-[36rem] rounded-full bg-primary/5 dark:bg-white/10 blur-3xl" />

      <section className="relative z-10 flex flex-col items-center justify-center px-6 py-24 max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic">
            Get in <span className="text-[#CC2224]">Touch</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Whether you&apos;re a brand, a partner, or just curious - we&apos;d love to hear from
            you.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 w-full">
          {/* Contact Info & Cards */}
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-8 hover:border-[#CC2224]/30 transition-all group"
              >
                <div className="w-12 h-12 bg-[#CC2224]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="h-6 w-6 text-[#CC2224]" />
                </div>
                <h3 className="text-lg font-bold mb-1">Email</h3>
                <a
                  href={`mailto:${email}`}
                  className="text-muted-foreground hover:text-[#CC2224] transition-colors text-sm break-all font-medium"
                >
                  {email}
                </a>
              </motion.div>

              {/* Phone Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-8 hover:border-[#CC2224]/30 transition-all group"
              >
                <div className="w-12 h-12 bg-[#CC2224]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Phone className="h-6 w-6 text-[#CC2224]" />
                </div>
                <h3 className="text-lg font-bold mb-1">Phone</h3>
                <a
                  href={`tel:${phone}`}
                  className="text-muted-foreground hover:text-[#CC2224] transition-colors text-sm font-medium"
                >
                  {phone}
                </a>
              </motion.div>
            </div>

            {/* Location Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-8 hover:border-[#CC2224]/30 transition-all group "
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[#CC2224]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <MapPin className="h-6 w-6 text-[#CC2224]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Location</h3>
                  <p className="text-muted-foreground text-sm font-medium">Delhi, India</p>
                </div>
              </div>
            </motion.div>

            {/* Social Links */}
            <div className="flex items-center gap-4 pt-4">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mr-4">
                Follow Us
              </p>
              <a
                href={settings?.socialInstagram || 'https://www.instagram.com/zenzebraindia/'}
                target="_blank"
                className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center hover:bg-[#CC2224] hover:border-[#CC2224] hover:text-white transition-all transform hover:-translate-y-1"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={settings?.socialLinkedIn || 'https://www.linkedin.com/company/zenzebraindia/'}
                target="_blank"
                className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center hover:bg-[#CC2224] hover:border-[#CC2224] hover:text-white transition-all transform hover:-translate-y-1"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-[2.5rem] border border-border bg-card p-8 sm:p-12 shadow-2xl shadow-black/5 dark:shadow-red-500/5 relative overflow-hidden group"
          >
            {/* Subtle glow inside form */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CC2224]/5 blur-[60px] rounded-full pointer-events-none" />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-2xl px-6 py-4 outline-none focus:border-[#CC2224] transition-colors font-medium"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 outline-none focus:border-[#CC2224] transition-colors font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Phone Number
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 outline-none focus:border-[#CC2224] transition-colors font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Your Query
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we help you?"
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  className="w-full bg-background border border-border rounded-2xl px-6 py-4 outline-none focus:border-[#CC2224] transition-colors font-medium resize-none"
                />
              </div>

              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-[#CC2224] text-white rounded-2xl py-5 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#b21e20] transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl shadow-[#CC2224]/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Footer line */}
        <div className="mt-24 border-t border-border pt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground text-center w-full">
          © {new Date().getFullYear()} {siteName}. Engineered for excellence.
        </div>
      </section>
    </main>
  );
}

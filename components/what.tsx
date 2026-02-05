"use client";

import { motion } from "framer-motion";

function what() {
  return (
    <section className="relative z-10  text-white py-24 px-6 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-center text-4xl sm:text-5xl font-bold text-white"
      >
        Welcome to the <span className="text-[#CC2224]">Dazzle</span>
      </motion.h2>

      
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-3xl mx-auto mt-6 text-white/80 text-lg leading-relaxed"
      >
        <span className="text-white font-medium">ZenZebra</span> is where better
        living meets real convenience - a BreakSpot made for the
        <span className="text-white font-medium"> curious, expressive, </span>
        and
        <span className="text-white font-medium"> always-on. </span>
        We bring exciting products right into your daily spaces - from offices
        to gyms to cafés - so you can
        <span className="text-white font-semibold">
          {" "}
          try anything instantly{" "}
        </span>
        or get it
        <span className="text-white font-semibold"> delivered in 2 minutes.</span>
        <br />
        <br />
        It’s not about escape; it’s
        <span className="text-white font-medium">
          {" "}
          self-expression, shared.{" "}
        </span>
        Think of it as a lifestyle store that lives with you - helping you snack
        smarter, feel better, and
        <span className="text-white font-medium">
          {" "}
          live effortlessly every day. 
        </span>
        {" "}No pressure. No guesswork.
      </motion.p>

      <p className="mt-6 text-white/60 italic">
        Right where you are. Try it. Own it.
      </p>
    </section>
  );
}

export default what;

"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function animateGroup(selector: string, vars: gsap.TweenVars) {
  const els = gsap.utils.toArray<HTMLElement>(selector);
  if (!els.length) return;
  const staggerVal = (vars.stagger as number) ?? 0.12;
  els.forEach((el, i) => {
    gsap.from(el, {
      ...vars,
      stagger: 0,
      delay: i * staggerVal,
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  });
}

export function ScrollAnimations() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Hero — plays on load, no scroll trigger
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from("[data-gsap='hero-badge']", { y: 24, opacity: 0, duration: 0.6 })
      .from("[data-gsap='hero-title']", { y: 36, opacity: 0, duration: 0.8 }, "-=0.35")
      .from("[data-gsap='hero-desc']",  { y: 20, opacity: 0, duration: 0.6 }, "-=0.45")
      .from("[data-gsap='hero-cta']",   { y: 20, opacity: 0, duration: 0.6 }, "-=0.35");

    // Refresh sau khi hero xong để tính lại vị trí các section bên dưới
    const t = setTimeout(() => {
      ScrollTrigger.refresh();

      animateGroup("[data-gsap='stat']",           { y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" });
      animateGroup("[data-gsap='feature-card']",   { y: 50, opacity: 0, duration: 0.65, stagger: 0.15, ease: "power3.out" });
      animateGroup("[data-gsap='guarantee-card']", { y: 50, opacity: 0, duration: 0.65, stagger: 0.15, ease: "power3.out" });
      animateGroup("[data-gsap='product-card']",   { y: 50, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" });

      gsap.utils.toArray<HTMLElement>("[data-gsap='section-title']").forEach(el => {
        gsap.from(el, {
          x: -30, opacity: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });
    }, 100);

    return () => {
      clearTimeout(t);
      gsap.killTweensOf("[data-gsap]");
      ScrollTrigger.getAll().forEach(st => st.kill());
      gsap.set("[data-gsap]", { clearProps: "all" });
    };
  }, []);

  return null;
}

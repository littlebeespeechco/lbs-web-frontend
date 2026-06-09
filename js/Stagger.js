// Stagger class
export class Stagger {
    constructor(element) {
        this.element = element;
        this.elements();
        this.animate();
    }
    
    elements() {
        // Initialize elements here
        this.directChildren = Array.from(this.element.children).filter(
            child => !child.classList.contains("stagger") && 
                     !child.classList.contains("stagger-left") && 
                     !child.classList.contains("stagger-right")
        );
        
        // Get indirect children from different stagger types
        const staggerLeftChildren = this.element.querySelectorAll(".stagger-left > *");
        const staggerRightChildren = this.element.querySelectorAll(".stagger-right > *");
        const staggerChildren = this.element.querySelectorAll(".stagger > *");
        
        // Determine staggerType based on which type of children exist
        if (staggerLeftChildren.length > 0) {
            this.staggerType = "left";
            this.indirectChildren = staggerLeftChildren;
        } else if (staggerRightChildren.length > 0) {
            this.staggerType = "right";
            this.indirectChildren = staggerRightChildren;
        } else {
            this.staggerType = "normal";
            this.indirectChildren = staggerChildren;
        }

        this.allChildren = [...this.directChildren, ...this.indirectChildren];
    }

    animate() {
        const noMove = this.element.hasAttribute("data-stagger-no-move");

        // Animation logic here
        // Direct children always use normal animation
        if (this.directChildren.length > 0) {
            const cs = getComputedStyle(this.element);
            const isMultiColumn = cs.columnCount !== "auto";
            // "Deck" layouts (CSS multi-column / grid / wrapping flex) place children so
            // that DOM order != visual position, and the column/track break reflows as
            // fonts and images load. Per-child ScrollTriggers measured at DOMContentLoaded
            // mis-read the boundary child's position, so it reveals late and flickers.
            const isDeck =
                isMultiColumn ||
                cs.display === "grid" ||
                cs.display === "inline-grid" ||
                (cs.display.indexOf("flex") !== -1 && cs.flexWrap === "wrap");

            if (isMultiColumn) {
                // Safari leaves a child sitting at a CSS multi-column break (e.g. the
                // top card of column 2 in .tips-slot) blank when it is individually
                // transform/opacity-animated while the page is scrolling — for ~the
                // tween duration, sometimes permanently. Don't animate the column
                // children at all: fade the whole container as a single composited
                // layer. The multi-column layout stays pixel-identical and no
                // column-break child is ever composited on its own.
                gsap.set(this.element, { opacity: 0 });
                gsap.to(this.element, {
                    opacity: 1,
                    duration: 1.2,
                    delay: 0.2,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: this.element,
                        start: "top bottom",
                        once: true
                    }
                });
            } else if (isDeck) {
                // grid / wrapping-flex decks: stable layout, animate children from a
                // single container-anchored trigger with a stagger.
                gsap.set(this.directChildren, {
                    opacity: 0,
                    ...(noMove ? {} : { y: "2rem" }),
                });
                gsap.to(this.directChildren, {
                    opacity: 1,
                    ...(noMove ? {} : { y: 0 }),
                    duration: 2,
                    delay: 0.2,
                    ease: "elastic.out(1, 0.7)",
                    stagger: { amount: 0.5 },
                    scrollTrigger: {
                        trigger: this.element,
                        start: "top bottom",
                        once: true
                    }
                });
            } else {
                // plain vertical stack: each child reveals as it scrolls into view.
                gsap.set(this.directChildren, {
                    opacity: 0,
                    ...(noMove ? {} : { y: "2rem" }),
                });
                gsap.utils.toArray(this.directChildren).forEach(child => {
                    gsap.to(child, {
                        opacity: 1,
                        ...(noMove ? {} : { y: 0 }),
                        duration: 2,
                        delay: 0.2,
                        ease: "elastic.out(1, 0.7)",
                        scrollTrigger: {
                            trigger: child,
                            start: "top bottom",
                            once: true
                        }
                    });
                });
            }
        }

        // Indirect children use animations based on staggerType
        if (this.indirectChildren.length > 0) {            
            gsap.set(this.indirectChildren, {
                opacity: 0,
                y: 30,
            });
            gsap.to(this.indirectChildren, {
                opacity: 1,
                y: 0,
                duration: 2,
                delay: 0.2,
                ease: "elastic.out(1, 0.7)",
                scrollTrigger: {
                    trigger: this.indirectChildren[0],
                    start: "top bottom",
                    end: "bottom top",
                    toggleActions: "play none none reset",
                },
                stagger: {
                    amount: 0.5,
                }
            });
        }
    }
}

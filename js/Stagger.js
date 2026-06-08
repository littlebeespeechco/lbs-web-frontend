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
            gsap.set(this.directChildren, {
                opacity: 0,
                ...(noMove ? {} : { y: "2rem" }),
            });

            // "Deck" layouts (CSS multi-column / grid / wrapping flex) place children so
            // that DOM order != visual position, and the column/track break reflows as
            // fonts and images load. Per-child ScrollTriggers measured at DOMContentLoaded
            // mis-read the boundary child's position, so it reveals late and flickers.
            // For decks, anchor one trigger to the stable container and stagger the children.
            const cs = getComputedStyle(this.element);
            const isDeck =
                cs.columnCount !== "auto" ||
                cs.display === "grid" ||
                cs.display === "inline-grid" ||
                (cs.display.indexOf("flex") !== -1 && cs.flexWrap === "wrap");

            if (isDeck) {
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

// FaqElements class
export class FaqElements {
    constructor(element) {
        this.element = element;
        this.elements();
        this.bind();        
    }

    elements() {
        this.items = this.element.querySelectorAll(".faq-item");
        this.items.forEach(item => {
            this.answer = item.querySelector(".faq-item-a");
        });
    }

    bind() {
        this.items.forEach(item => {
            item.open = false;

            item.addEventListener("click", () => {
                this.toggle(item);                
            });
        });
    }

    toggle(item) {
        const answer = item.querySelector(".faq-item-a");

        if (!item.open) {
            // Open: apply .active, then measure the FULL target height
            // (content + padding) up front and animate to that exact pixel
            // value. Animating to height:"auto" mis-measured while padding was
            // mid-tween, so it opened ~17px short and popped on complete.
            // Padding animates from 0 alongside height so nothing jumps at
            // frame 0. ease-out only (fast start, decelerate).
            item.classList.add("active");
            // Drop any inline padding left by a previous close — otherwise the
            // stale inline padding-bottom:0 overrides the .active CSS and we'd
            // read 0, animating re-opened cells to no bottom padding.
            answer.style.paddingBottom = "";
            const padBottom = parseFloat(getComputedStyle(answer).paddingBottom) || 0;
            const target = answer.scrollHeight; // full content + padding, even while collapsed
            gsap.fromTo(answer,
                { height: 0, paddingBottom: 0 },
                {
                    height: target,
                    paddingBottom: padBottom,
                    duration: 0.5,
                    ease: "power2.out",
                    overwrite: "auto",
                    // settle to auto so later reflow (resize, font swap) stays correct
                    onComplete: () => { answer.style.height = "auto"; },
                }
            );
        } else {
            // Close: ease-out only (fast start, decelerate) — no slow ease-in
            // lead. Height + padding collapse together to 0, then clear the
            // inline values so the next open reads the CSS target cleanly.
            item.classList.remove("active");
            gsap.to(answer, {
                height: 0,
                paddingBottom: 0,
                duration: 0.4,
                ease: "power2.out",
                overwrite: "auto",
                onComplete: () => { gsap.set(answer, { clearProps: "height,paddingBottom" }); },
            });
        }
        item.open = !item.open;
    }
}


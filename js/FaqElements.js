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
            // Open: add .active first, read the expanded bottom padding it
            // applies, then animate height AND padding together from zero.
            // (Previously .active set the padding instantly while only height
            // tweened, so the padding appeared in one frame — the "jump".)
            item.classList.add("active");
            const padBottom = parseFloat(getComputedStyle(answer).paddingBottom) || 0;
            gsap.fromTo(answer,
                { height: 0, paddingBottom: 0 },
                {
                    height: "auto",
                    paddingBottom: padBottom,
                    duration: 0.5,
                    ease: "power2.out",
                    overwrite: "auto",
                }
            );
        } else {
            // Close: accelerate to a snappy finish (power2.in) instead of
            // circ.out, which decelerated and dragged the tail. Padding
            // collapses alongside the height so it never jumps at the end.
            item.classList.remove("active");
            gsap.to(answer, {
                height: 0,
                paddingBottom: 0,
                duration: 0.4,
                ease: "power2.in",
                overwrite: "auto",
            });
        }
        item.open = !item.open;
    }
}


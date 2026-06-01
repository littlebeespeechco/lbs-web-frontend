// Parallax class
export class Parallax {
    constructor(element) {
        this.element = element;

        this.elements();

        const initiate = () => {
            this.sizing();
            this.animate();
            g.scrollTrigger.refresh();
        }
        
        // wait for the image to load or check if it's loaded
        if (this.image.complete) {
            initiate();
        } else {
            this.image.addEventListener("load", () => {
                initiate();
            });
        }

        window.addEventListener("resize", () => {
            this.sizing();
            g.scrollTrigger.refresh();
        });
    }

    elements() {
        if (this.element.tagName.toLowerCase() === "img") {
            this.wrapper = this.element.parentElement;
        } else {
            this.wrapper = this.element;
        }
        if (this.element.tagName.toLowerCase() === "img") {
            this.image = this.element;
        } else {
            this.image = this.element.querySelector("img");
        }
        this.direction = this.image.getAttribute("data-parallax-image") === "down" ? "up" : "up";
        const header = document.querySelector(".w-nav, nav, header");
        this.headerHeight = header ? header.offsetHeight : 86;
    }

    sizing() {
        this.wrapperHeight = this.wrapper.offsetHeight;
        this.imageHeight = this.image.getBoundingClientRect().height;
        this.travelDistance = this.imageHeight - this.wrapperHeight;
    }

    animate() {
        // Calculate how far the image needs to travel
        
        // Set initial position (image at bottom of wrapper)
        gsap.set(this.image, {
            y: this.direction === "up" ? -this.travelDistance : 0
        });

        // Create ScrollTrigger animation
        this.scrollTrigger = gsap.to(this.image, {
            y: this.direction === "up" ? 0 : -this.travelDistance,
            ease: "none",
            scrollTrigger: {
                trigger: this.wrapper,
                start: "top bottom",
                end: `top ${this.headerHeight}px`,
                scrub: true
            }
        });
    }
}

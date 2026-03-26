export class TestimonialsNext {
    constructor(element) {
        this.element = element;
        this.currentPage = null;
        this.previousBreakpoint = null;

        this.elements();
        this.bind();
        this.sizing();
    }

    elements() {
        this.wrapper = this.element.querySelector(".testimonials-wrapper");
        this.items = this.wrapper.querySelectorAll(".testimonial");
        this.bullets = this.element.querySelector(".testimonials-bullets");
        this.next = this.element.querySelector(".testimonials-controls-next");
        this.prev = this.element.querySelector(".testimonials-controls-prev");
    }

    sizing() {
        this.viewPortBreakpoint = window.innerWidth < 768 ? "mobile" : window.innerWidth < 992 ? "tablet" : "desktop";

        // Detect viewport breakpoint change
        if (this.viewPortBreakpoint !== this.previousBreakpoint) {
            this.itemsPerPage = this.viewPortBreakpoint === "mobile" ? 1 : this.viewPortBreakpoint === "tablet" ? 2 : 3;
            this.totalPages = Math.ceil(this.items.length / this.itemsPerPage);
            this.bullets.innerHTML = "";
            
            for (let i = 0; i < this.totalPages; i++) {
                const bullet = document.createElement("div");
                bullet.classList.add("testimonials-bullet");
                this.bullets.appendChild(bullet);
            }
            this.lastPageItemsQuantity = this.items.length % this.itemsPerPage;
            this.indicatorsBullets = this.bullets.querySelectorAll(".testimonials-bullet");
            this.indicatorsBullets[0].classList.add("active", "from-left");            
        }

        this.wrapperPadding = parseFloat(getComputedStyle(this.wrapper).paddingLeft) + parseFloat(getComputedStyle(this.wrapper).paddingRight);
        this.itemsGap = parseFloat(getComputedStyle(this.wrapper).columnGap);
        
        this.viewportWidth = this.element.offsetWidth - this.wrapperPadding;
        this.itemsWidth = Math.ceil(this.viewPortBreakpoint === "mobile" ? this.viewportWidth * 0.8 : (this.viewportWidth - this.itemsGap * (this.itemsPerPage - 1)) / this.itemsPerPage);
        this.pos.stored = -this.currentPage * (this.itemsWidth + this.itemsGap) * this.itemsPerPage + (this.currentPage == this.totalPages - 1 ? (this.itemsPerPage - this.lastPageItemsQuantity) * (this.itemsWidth + this.itemsGap) : 0);
        
        gsap.set(this.items, {
            width: this.itemsWidth,
        });

        // if breakpoint changes change page to 0
        if (this.viewPortBreakpoint !== this.previousBreakpoint) {
            this.currentPage = null;
            this.changePage(0);
            this.previousBreakpoint = this.viewPortBreakpoint;
        }
        
    }

    bind() {
        this.pos = {
            new: 0,
            old: 0,
            stored: 0,
            delta: 0,
            eased: 0,
            dragging: false
        }

        this.mousedownEvents = (e) => {
            this.pos.dragging = true;
            this.pos.delta = 0;
            this.pos.eased = this.pos.stored;
            this.pos.old = e.touches ? e.touches[0].clientX : e.clientX;
        }

        this.mousemoveEvents = (e) => {
            if (!this.pos.dragging) return;
            this.pos.new = e.touches ? e.touches[0].clientX : e.clientX;
            this.pos.delta = this.pos.new - this.pos.old;
        }

        this.mouseupEvents = () => {
            this.pos.dragging = false;
            
            if (this.pos.delta < -200 && this.currentPage < this.totalPages - 1) {
                this.changePage(this.currentPage + 1);
            } else if (this.pos.delta > 200 && this.currentPage > 0) {
                this.changePage(this.currentPage - 1);
            } else {
                this.pos.stored = -this.currentPage * (this.itemsWidth + this.itemsGap) * this.itemsPerPage + (this.currentPage == this.totalPages - 1 ? (this.itemsPerPage - this.lastPageItemsQuantity) * (this.itemsWidth + this.itemsGap) : 0);
            }
            
            this.pos.delta = 0;
        }

        this.next.addEventListener("click", () => {
            if (this.currentPage === this.totalPages - 1) { return; }
            this.changePage(this.currentPage + 1);
        });
        this.prev.addEventListener("click", () => {
            if (this.currentPage === 0) { return; }
            this.changePage(this.currentPage - 1);
        });

        window.addEventListener("mousedown", this.mousedownEvents);
        window.addEventListener("mousemove", this.mousemoveEvents);
        window.addEventListener("mouseup", this.mouseupEvents);
        window.addEventListener("touchstart", this.mousedownEvents);
        window.addEventListener("touchmove", this.mousemoveEvents);
        window.addEventListener("touchend", this.mouseupEvents);

        this.ticker = () => {
            this.pos.eased += (this.pos.stored + this.pos.delta - this.pos.eased) * 0.05;
            gsap.to(this.wrapper, {
                x: this.pos.eased,
                duration: 0.5,
                ease: "power2.out",
            });
        }

        window.addEventListener("resize", () => {
            this.sizing();
        });

        gsap.ticker.add(this.ticker);
    }

    changePage(page) {
        this.indicatorsBullets[page].classList.add("active", page > this.currentPage ? "from-left" : "from-right");
        if (this.currentPage !== null) {
            this.indicatorsBullets[this.currentPage].classList.remove("active", "from-left", "from-right");        
        }
        this.currentPage = page;
        this.pos.stored = -this.currentPage * (this.itemsWidth + this.itemsGap) * this.itemsPerPage + (this.currentPage == this.totalPages - 1 ? (this.itemsPerPage - this.lastPageItemsQuantity) * (this.itemsWidth + this.itemsGap) : 0);
        gsap.to(this.wrapper, {
            x: this.pos.stored,
            duration: 1,
            ease: "power2.out",
        });

        this.bullets.querySelectorAll(".testimonials-bullet").forEach((bullet, index) => {
            bullet.classList.remove("active");
        });
        this.bullets.querySelectorAll(".testimonials-bullet")[this.currentPage].classList.add("active");
    }

    toggleSnap(dragging = false) {
        dragging ? this.wrapper.classList.add("snap") : this.wrapper.classList.remove("snap");
    }
}

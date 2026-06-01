// Megamenu class
export class Megamenu {
    constructor(element) {
        if (element.getAttribute("data-wf--header--variant") === "signup") return;
        this.element = element;        
        this.isShowing = false;
        this.currentTarget = null;
        this.isMobileMenuOpen = false;



        this.elements();
        this.binds();
        this.update();
        this.sizing();

        window.addEventListener("resize", () => {
            this.sizing();
        });
    }

    elements() {
        this.wrapper = this.element.querySelector(".header-megamenu");
        this.logo = this.element.querySelector(".header-logo");
        this.menu = this.element.querySelector(".header-menu");
        this.productsMobile = this.element.querySelector(".header-mobile-products-wrapper");
        this.productsMobileLink = this.element.querySelector(".mobile-products-link");
        this.mobileToggler = this.element.querySelector(".header-toggler");
        this.mobileMenu = this.element.querySelector(".header-mobile");
        this.mobileOpen = this.element.querySelector(".header-toggler-open");
        this.mobileClose = this.element.querySelector(".header-toggler-close");
        this.links = this.element.querySelectorAll("[megamenu-link='0']");
        this.menuLinks = this.element.querySelectorAll("[megamenu-link='1']");
        this.menuTargets = this.element.querySelectorAll("[megamenu-target]");
        this.megamenu = this.element.querySelector(".header-megamenu");
        this.megamenuWrapper = this.element.querySelector(".header-megamenu-wrapper");

        gsap.set(this.menuTargets, {
            opacity: 0
        });
        
        gsap.set(this.mobileMenu, {
            scale: 1,
            autoAlpha: 0,
        });
    }

    binds() {
        this.menuLinks.forEach((link, index) => {
            link.addEventListener("mouseenter", () => {                
                if (!this.isShowing) {
                    this.isShowing = true;
                    this.showMegamenu(true);
                }
                link.classList.add("active");
                if (this.currentTarget !== null && this.currentTarget !== index) {
                    this.menuLinks[this.currentTarget].classList.remove("active");
                }
                if (this.currentTarget === index) return;
                this.showMenu(index);  
            });
        });

        this.element.addEventListener("mouseleave", () => {
            if (!this.isShowing) return;
            this.isShowing = false;
            this.showMegamenu(false);
            if (this.currentTarget !== null) {
                this.menuLinks[this.currentTarget].classList.remove("active");
            }
        });

        this.links.forEach(link => {
            link.addEventListener("mouseenter", () => {
                if (!this.isShowing) return;
                this.isShowing = false;
                this.showMegamenu(false);
                if (this.currentTarget !== null) {
                    this.menuLinks[this.currentTarget].classList.remove("active");
                }
            });
            link.addEventListener("click", (e) => {
                if (this.isMobileMenuOpen) {
                    this.openMobileMenu(false);
                }
            });
        });

        this.productsMobileLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isOpening = !this.productsMobile.classList.contains("active");
            const duration = 0.6;
            const ease = "power2.inOut";

            if (isOpening) {
                // Add .active so padding/margin/opacity CSS transitions start;
                // then animate height from 0 to measured content size.
                this.productsMobile.classList.add("active");
                gsap.fromTo(this.productsMobile,
                    { height: 0 },
                    {
                        height: this.productsMobile.scrollHeight,
                        duration,
                        ease,
                        onComplete: () => {
                            // Let height be content-driven once the open animation finishes
                            // so subsequent reflows (orientation, image load) don't crop.
                            this.productsMobile.style.height = "auto";
                        }
                    }
                );
            } else {
                // Pin the current height as inline px before animating to 0,
                // otherwise GSAP starts from `auto` which doesn't tween.
                const current = this.productsMobile.scrollHeight;
                this.productsMobile.style.height = current + "px";
                this.productsMobile.offsetHeight; // force reflow
                // Remove .active NOW so padding/margin/opacity CSS transitions
                // run in parallel with the height tween — otherwise close
                // happens in two visible stages (height collapses to padding,
                // then padding/margin animate).
                this.productsMobile.classList.remove("active");
                gsap.to(this.productsMobile, {
                    height: 0,
                    duration,
                    ease,
                    onComplete: () => {
                        // Clear inline height so the SCSS rule (height: 0) re-applies.
                        this.productsMobile.style.height = "";
                    }
                });
            }

            gsap.to(this.productsMobileLink.querySelector("div"), {
                scaleY: isOpening ? -1 : 1
            });
        });

        this.mobileToggler.addEventListener("click", () => {
            this.openMobileMenu(!this.isMobileMenuOpen);
        });

        this.menu.addEventListener("mouseenter", (e) => {
            e.preventDefault();
        });

        this.element.addEventListener("mousemove", (e) => {
            if (!this.isShowing || this.currentTarget === null) return;
            const activeLink = this.menuLinks[this.currentTarget];
            const linkRect = activeLink.getBoundingClientRect();
            const menuRect = this.megamenu.getBoundingClientRect();
            const overMegamenu = e.clientX >= menuRect.left && e.clientX <= menuRect.right
                              && e.clientY >= menuRect.top  && e.clientY <= menuRect.bottom;
            if (e.clientX < linkRect.left - 20 && !overMegamenu) {
                this.isShowing = false;
                this.showMegamenu(false);
                activeLink.classList.remove("active");
            }
        });
    }

    observe() {
        // Add a resize observer to the element
        const resizeObserver = new ResizeObserver(() => {
            this.sizing();            
        });
        resizeObserver.observe(this.element);
    }

    sizing() {
        this.left = this.megamenu.getBoundingClientRect().left;
        this.top = this.megamenu.getBoundingClientRect().top;
    }

    showMenu(newIndex) {        
        const targetElement = this.menuTargets[newIndex];
        const previousTarget = this.menuTargets[this.currentTarget];
        
        if (this.currentTarget !== null) {
            gsap.to(previousTarget, {
                opacity: 0,
                duration: 1,
                xPercent: this.currentTarget > newIndex ? 100 : -100,
                ease: "power4.inOut"
            });
        }
        
        if (targetElement) {
            gsap.set(targetElement, {
                xPercent: this.currentTarget !== null ? (this.currentTarget > newIndex ? -100 : 100) : 0
            });

            gsap.to(targetElement, {
                opacity: 1,
                duration: 1,
                xPercent: 0,
                ease: "power4.inOut"
            });
        }

        this.currentTarget = newIndex;
    }

    showMegamenu(show) {
        gsap.set(this.megamenu, {
            autoAlpha: show ? 0 : 1,
            y: show ? 0 : -30,
        });
        gsap.set(this.megamenu, {
            autoAlpha: show ? 1 : 0,
            duration: 0.5,
            y: show ? -30 : 0,
            ease: "power4.out"
        });
        
        this.megamenuShowing = show;
    }

    update() {
        this.menuSmall = false;
        this.ticker = () => {
            if (window.lenis.targetScroll > 0 && !this.menuSmall) {
                this.menuSmall = true;
                gsap.to(this.logo, {
                    padding: "1rem 0",
                })
            } else if (window.lenis.targetScroll <= 0 && this.menuSmall) {
                this.menuSmall = false;
                gsap.to(this.logo, {
                    // reset padding
                    padding: "2.125rem 0",

                })
            }
        }
        gsap.ticker.add(this.ticker);
    }

    openMobileMenu(open) {
        console.log("opening mobile menu");

        // Toggle a body class so the sticky .header can use a more opaque bg
        // when menu content is scrolling beneath it (SCSS rule in app.scss).
        document.body.classList.toggle("menu-open", open);

        // Inject (or remove) a white-blurry bar INSIDE .header (this.element).
        // The drawer (.header-mobile) is a child of .header — same stacking
        // context. Logo (z:3) and X-wrapper (z:3) are siblings of the drawer
        // (z:2). The bar slots in at z:2.5 — above the drawer, below the
        // logo and X. Appending it inside .header avoids cross-context
        // compositing battles with the drawer's GSAP-promoted layer.
        if (open) {
            if (!this.topBar) {
                this.topBar = document.createElement("div");
                this.topBar.className = "menu-open-top-bar";
            }
            this.element.appendChild(this.topBar);
        } else if (this.topBar && this.topBar.parentNode) {
            this.topBar.parentNode.removeChild(this.topBar);
        }

        gsap.set(this.mobileClose, {
            autoAlpha: open ? 0 : 1,
            scale: open ? 0 : 1,
            overwrite: true,
            rotate: open ? 45 : 0,
        });
        gsap.to(this.mobileOpen, {
            scaleX: open ? 0 : 1,
            transformOrigin: "right center",
            duration: 1,
            ease: "power4.inOut"
        })
        gsap.to(this.mobileClose, {
            autoAlpha: open ? 1 : 0,
            duration: 1,
            scale: open ? 1 : 0,
            ease: "elastic.out(1, 0.7)",
            delay:open ? 0.6 : 0,
            rotate: open ? 0 : 45,
        })
        gsap.set(this.mobileMenu, {
            clipPath: open ? "inset(0% 0% 100% 0%)" : "inset(0% 0% 0% 0%)",
            autoAlpha: open ? 1 : 1,
            overwrite: true,
        });
        gsap.to(this.mobileMenu, {
            duration: 1,
            clipPath: open ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
            autoAlpha: open ? 1 : 0,
            ease: "power4.inOut"
        });

        this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }
}

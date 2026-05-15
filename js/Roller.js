// Roller class
export class Roller {
    constructor(element) {        
        this.element = element;
        this.position = 0;
        
        this.elements();
        this.loader();
    }

    elements() {
        this.logos = this.element.querySelectorAll("img");
        
        this.logos.forEach(logo => {
            this.loaded = false;
        });
    }

    loader() {
        let logosLoaded = 0;
        let logosToLoad = this.logos.length;
        
        const checkIfAllLoaded = () => {
            if (logosLoaded === logosToLoad) {
                this.sizing();
                this.update();   
            }
        }
        this.logos.forEach(logo => {

            if (logo.complete) {
                // Image already loaded
                this.loaded = true;
                logosLoaded++;
                checkIfAllLoaded();
            } else {
                // Image not yet loaded, wait for load event
                logo.addEventListener("load", () => {
                    this.loaded = true;
                    logosLoaded++;
                    checkIfAllLoaded();
                });
            }
        });

        window.addEventListener("resize", () => {
            this.sizing();
        });
    }

    sizing() {
        this.totalWidth = this.logos[this.logos.length - 1].offsetWidth + this.logos[this.logos.length - 1].offsetLeft + (parseInt(getComputedStyle(this.element).gap) || 0) - this.element.offsetLeft;        

        this.logos.forEach(logo => {
            logo.startingWidth = logo.offsetWidth;
            logo.startingX = logo.offsetLeft - this.element.offsetLeft;
            logo.loop = 0;
        });

        // Get the widest logo's width
        let widestLogoWidth = 0;
        this.logos.forEach(logo => {
            if (logo.offsetWidth > widestLogoWidth) {
                widestLogoWidth = logo.offsetWidth;
            }
        });

        // Styling
        gsap.set(this.element, {
            width: Math.min(this.element.parentElement.clientWidth, this.totalWidth - widestLogoWidth),
        });
    }

    update() {        
        this.ticker = () => {
            this.position -= 0.5;
            this.logos.forEach((logo, index) => {                
                if (-this.position > (logo.startingWidth + logo.startingX + logo.loop * this.totalWidth) ) {
                    logo.loop++;
                }
                gsap.set(logo, {
                    x: logo.loop * this.totalWidth + this.position,
                });
            });
        }

        gsap.ticker.add(this.ticker);	
    }
}


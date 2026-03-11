// Memberships class
export class Memberships {
    constructor(element) {
        this.element = element;
        this.currentTab = null;
        
        this.elements();
        this.bind();
        if (window.location.hash) {
            console.log("works?");
            
            const tabName = window.location.hash.substring(1);
            const index = this.togglerLinks.findIndex(link => link.textContent.toLowerCase() === tabName);
            if (index !== -1) {
                this.showTab(index);
            }
        } else {
            this.showTab(0);
        }

        // Detect hash change and show the corresponding tab
        window.addEventListener("hashchange", () => {
            const tabName = window.location.hash.substring(1);
            const index = this.togglerLinks.findIndex(link => link.textContent.toLowerCase() === tabName);
            if (index !== -1) {
                this.showTab(index);
            }
        });
    }

    elements() {
        this.togglerLinks = Array.from(this.element.querySelectorAll(".memberships-toggler div:not(.memberships-indicator)"));
        this.headings = this.element.querySelectorAll(".pricing-heading");
        this.tabs = this.element.querySelectorAll(".memberships-tab");
        this.indicator = this.element.querySelector(".memberships-indicator");
        this.tabs.forEach(tab => {
            tab.items = tab.querySelectorAll(".membership-plan");
            tab.items.forEach(item => {
                item.numeral = item.querySelector(".membership-pricing-number");
                item.originalNumber = item.numeral.textContent;
            });
        });
    }

    bind() {
        this.togglerLinks.forEach((item, index) => {
            item.addEventListener("click", () => {
                if (this.currentTab === index) return;
                this.showTab(index);
            });
        });
    }

    showTab(index) {
        const currentTab = this.tabs[index];
        const currentHeading = this.headings[index];
        const left = index > this.currentTab ? true : false;
        const bgcolors = ["#FFDF10", "#72BEE0"];
        const textcolors = ["#404040", "#FFFFFF", "#A9A9A9"];
        const currentTabName = this.togglerLinks[index].textContent.toLowerCase();
        
        // add hash url to current tab name
        window.location.hash = currentTabName;
        

        if (this.currentTab !== null) {
            const previousTab = this.tabs[this.currentTab];
            const previousHeading = this.headings[this.currentTab];
            gsap.to(previousHeading, {
                autoAlpha: 0,
                duration: 0.5,
                overwrite: true
            });
            gsap.to(previousTab.items, {
                autoAlpha: 0,
                duration: 0.5,
                ease: "power4.out",
                xPercent: left ? 20 : -20,
                stagger: left ? -0.05 : 0.05
            });
            gsap.set(previousTab, {
                autoAlpha: 0,
                duration: 0.5,
                delay: 0.5
            });
        }

        
        const tl = gsap.timeline();
        tl.to(currentHeading, {
            autoAlpha: 1,
            duration: 0.5,
            delay: 0.5,
            overwrite: true
        }, 0);
        tl.to(this.indicator, {
            xPercent: -50,
            duration: 0.5,
            left: 50 + index * 100 + "%",
            ease: "power4.out"
        }, 0);
        tl.to(this.indicator, {
            width: "20%",
            duration: 0.5,
            ease: "power4.out"
        }, 0);
        tl.to(this.indicator, {
            width: "100%",
            duration: 1,
            ease: "elastic.out(1, 1.3)",
            backgroundColor: bgcolors[index],
        }, 0.2);

        // Togglerlinks colors
        this.togglerLinks.forEach((item, i) => {
            gsap.to(item, {
                color: i === index ? textcolors[index] : textcolors[2],
                duration: 1,
                ease: "power4.out"
            });
        });

        gsap.to(currentTab, {
            autoAlpha: 1,
            duration: 0.5,
            ease: "power4.inOut"
        });
        gsap.fromTo(currentTab.items, {
            autoAlpha: 0,
            xPercent: left ? -20 : 20,
        }, {
            autoAlpha: 1,
            xPercent: 0,
            duration: 0.5,
            ease: "power4.out",
            stagger: left ? -0.05 : 0.05,
            delay: 0.25
        });
        
        this.currentTab = index;
    }
}

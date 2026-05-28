// Memberships class
export class Memberships {
    constructor(element) {
        this.element = element;
        this.currentTab = null;
        
        this.elements();
        this.bind();
        if (window.location.hash) {
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
            if (index !== -1 && index !== this.currentTab) {
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
        // Collapse all tabs so inactive ones don't inflate the grid row height
        gsap.set(this.tabs, { display: 'none' });
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
        const bgcolors = ["#FFDF10", "#72BEE0"];
        const textcolors = ["#404040", "#FFFFFF", "#A9A9A9"];
        const currentTabName = this.togglerLinks[index].textContent.toLowerCase();
        
        // add hash url to current tab name
        window.location.hash = currentTabName;
        

        // Restore display so the tab participates in layout before animating in
        gsap.set(currentTab, { clearProps: 'display' });

        if (this.currentTab !== null) {
            const previousTab = this.tabs[this.currentTab];
            const previousHeading = this.headings[this.currentTab];
            gsap.to(previousHeading, {
                autoAlpha: 0,
                duration: 0.3,
                overwrite: true
            });
            gsap.to(previousTab, {
                autoAlpha: 0,
                duration: 0.3,
            });
            gsap.delayedCall(0.3, () => gsap.set(previousTab, { display: 'none' }));
        }

        const tl = gsap.timeline();
        tl.to(currentHeading, {
            autoAlpha: 1,
            duration: 0.3,
            delay: 0.3,
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

        gsap.set(currentTab.items, { clearProps: 'all' });
        gsap.to(currentTab, {
            autoAlpha: 1,
            duration: 0.3,
            delay: 0.3,
            ease: "power4.inOut"
        });
        
        this.currentTab = index;
    }
}

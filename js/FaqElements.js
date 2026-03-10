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
            gsap.to(answer, {
                height: "auto",
                duration: 1,
                ease: "circ.out",
            })
            item.classList.add("active");
        } else {
            gsap.to(answer, {
                height: 0,
                duration: 1,
                ease: "circ.out",
            })
            item.classList.remove("active");
        }
        item.open = !item.open;
    }
}


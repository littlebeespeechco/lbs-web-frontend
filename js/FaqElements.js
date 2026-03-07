// FaqElements class
export class FaqElements {
    constructor(element) {
        this.element = element;
        this.elements();
        this.bind();        
    }

    elements() {
        this.items = this.element.querySelectorAll(".faq-item");
        this.answer = this.element.querySelector(".faq-item-a");
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
        if (!item.open) {
            gsap.to(this.answer, {
                height: "auto",
                duration: 1,
                ease: "circ.out",
            })
            item.classList.add("active");
        } else {
            gsap.to(this.answer, {
                height: 0,
                duration: 1,
                ease: "circ.out",
            })
            item.classList.remove("active");
        }
        item.open = !item.open;
    }
}


// JavaScript Modules
import Lenis from "lenis";
import { Button } from "./Button.js";
import { Roller } from "./Roller.js";
import { Hex } from "./Hex.js";
import { MovingHex } from "./MovingHex.js";
import { InteractiveHex } from "./InteractiveHex.js";
import { Diction } from "./Diction.js";
import { Megamenu } from "./Megamenu.js";
import { Video } from "./Video.js";
import { Parallax } from "./Parallax.js";
import { Memberships } from "./Memberships.js";
import { SearchResults } from "./SearchResults.js";
import { ShrinkText } from "./ShrinkText.js";
import { Testimonials } from "./Testimonials.js";
import { FaqElements } from "./FaqElements.js";
import { Stagger } from "./Stagger.js";
import { HeadingWave } from "./HeadingWave.js";
import { Image } from "./Image.js";
import { Balls } from "./Balls.js";
import { Annotations } from "./Annotations.js";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("v0.9");
        
        gsap.registerPlugin(ScrollTrigger, SplitText);
        const g = {}
        window.g = g;
        
        g.scrollTrigger = ScrollTrigger;
        g.splitText = SplitText;
        g.pxToRem = (px) => {
            return ( px / 16 * 1 ) + "rem";
        }
        handleLazyLoad();

        // Initialize Lenis smooth scroll
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });        

        function raf(time) {
            if (window.innerWidth < 992 && lenis.isStopped) {
                lenis.stop();
                
            } else if (window.innerWidth >= 992 && lenis.isStarted) {
                lenis.start();
                
            }
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        //stop lenis 
        lenis.stop();

        //reload lenis animations
        $(document).ready(function(){lenis.start();})

        window.lenis = lenis;

        getFontSize();
        window.addEventListener('resize', () => {
            getFontSize();
        });
        getLinkColor();
        // Classes
        const buttonElements = document.querySelectorAll("[data-button-text]");
        buttonElements.forEach(element => {
            new Button(element);
        });

        const rollerElements = document.querySelectorAll("[data-roller]");
        rollerElements.forEach(element => {
            new Roller(element);
        });

        const hexElements = document.querySelectorAll(".bg-hex");
        hexElements.forEach(element => {
            new Hex(element);
        });

        const shrinkText = document.querySelectorAll("[data-shrink]");
        shrinkText.forEach(element => {
            new ShrinkText(element);
        });

        const testimonialElements = document.querySelectorAll("[testimonial]");
        testimonialElements.forEach(element => {
            new Testimonials(element);
        });

        const faqElements = document.querySelectorAll("[faq]");
        faqElements.forEach(element => {
            new FaqElements(element);
        });

        const movingHexElements = document.querySelectorAll("[moving-hex]");
        movingHexElements.forEach(element => {
            new MovingHex(element);
        });

        const movingHexAnimationElements = document.querySelectorAll("[data-animation='moving-hex']");
        movingHexAnimationElements.forEach(element => {
            new MovingHex(element);
        });

        const dictionElements = document.querySelectorAll("[data-animation='diction']");
        dictionElements.forEach(element => {
            new Diction(element);
        });

        const megamenuElements = document.querySelectorAll("[megamenu]");
        megamenuElements.forEach(element => {
            new Megamenu(element);
        });

        const videoModalElements = document.querySelectorAll("[data-video]");
        videoModalElements.forEach(element => {
            new Video(element);
        });

        const parallaxElements = document.querySelectorAll("[data-animation='parallax']");
        parallaxElements.forEach(element => {
            new Parallax(element);
        });

        const membershipsElements = document.querySelectorAll("[data-animation='memberships']");
        membershipsElements.forEach(element => {
            new Memberships(element);
        });

        const interactiveHexElements = document.querySelectorAll("[data-animation='interactivehex']");
        interactiveHexElements.forEach(element => {
            new InteractiveHex(element);
        });

        const staggerElements = document.querySelectorAll("[data-animation='stagger']");
        staggerElements.forEach(element => {
            new Stagger(element);
        });

        const headingWaveElements = document.querySelectorAll("[data-animation='headingWave']");
        headingWaveElements.forEach(element => {
            new HeadingWave(element);
        });

        const imageElements = document.querySelectorAll("[data-animation='image']");
        imageElements.forEach(element => {
            new Image(element);
        });

        const ballsElements = document.querySelectorAll("[data-animation='balls']");
        ballsElements.forEach(element => {
            new Balls(element);
        });

        const annotationElements = document.querySelectorAll("[data-annotation]");
        annotationElements.forEach(element => {
            new Annotations(element);
        });

        const searchResultsElements = document.querySelectorAll("[search-results]");
        searchResultsElements.forEach(element => {
            new SearchResults(element);
        });
    });
}


function getFontSize() {
    const breakpoint = window.innerWidth < 768 ? "small" : window.innerWidth < 992 ? "medium" : "desktop";
    let fontSize = 
        breakpoint === "small" ?  Math.min(16, document.body.clientWidth / 402 * 16) : 
        breakpoint === "medium" ? Math.max(14, document.body.clientWidth / 991 * 16) : 
        Math.max(14, Math.min(document.body.clientWidth / 1290 * 16, 16))
    ;
    
    document.documentElement.style.setProperty('--fontSize', fontSize + 'px');
}

function handleLazyLoad(config={}) {
    let lazyImages = gsap.utils.toArray("img[loading='lazy']"),
        timeout = gsap.delayedCall(config.timeout || 1, ScrollTrigger.refresh).pause(),
        lazyMode = config.lazy !== false,
        imgLoaded = lazyImages.length,
        onImgLoad = () => lazyMode ? timeout.restart(true) : --imgLoaded || ScrollTrigger.refresh();
    lazyImages.forEach((img, i) => {
      lazyMode || (img.loading = "eager");
      img.naturalWidth ? onImgLoad() : img.addEventListener("load", onImgLoad);
    });
}

export function splitTextGradient(parent, chars) {
    const color1 = getComputedStyle(parent).getPropertyValue('--color1');
    const color2 = getComputedStyle(parent).getPropertyValue('--color2');

    const color = gsap.utils.interpolate(color1, color2);
    
    gsap.set(chars, {
        color: (index, target, targets) => color(index / (targets.length - 1))
    })
    
}

function getLinkColor() {
    const links = document.querySelectorAll("a");
    links.forEach(link => {
        const color = getComputedStyle(link).getPropertyValue('color');
        link.style.setProperty('--color', color);
    });
    
}
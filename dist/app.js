(() => {
  // node_modules/lenis/dist/lenis.mjs
  var version = "1.3.17";
  function clamp(min, input, max) {
    return Math.max(min, Math.min(input, max));
  }
  function lerp(x, y, t2) {
    return (1 - t2) * x + t2 * y;
  }
  function damp(x, y, lambda, deltaTime) {
    return lerp(x, y, 1 - Math.exp(-lambda * deltaTime));
  }
  function modulo(n2, d2) {
    return (n2 % d2 + d2) % d2;
  }
  var Animate = class {
    isRunning = false;
    value = 0;
    from = 0;
    to = 0;
    currentTime = 0;
    // These are instanciated in the fromTo method
    lerp;
    duration;
    easing;
    onUpdate;
    /**
     * Advance the animation by the given delta time
     *
     * @param deltaTime - The time in seconds to advance the animation
     */
    advance(deltaTime) {
      if (!this.isRunning) return;
      let completed = false;
      if (this.duration && this.easing) {
        this.currentTime += deltaTime;
        const linearProgress = clamp(0, this.currentTime / this.duration, 1);
        completed = linearProgress >= 1;
        const easedProgress = completed ? 1 : this.easing(linearProgress);
        this.value = this.from + (this.to - this.from) * easedProgress;
      } else if (this.lerp) {
        this.value = damp(this.value, this.to, this.lerp * 60, deltaTime);
        if (Math.round(this.value) === this.to) {
          this.value = this.to;
          completed = true;
        }
      } else {
        this.value = this.to;
        completed = true;
      }
      if (completed) {
        this.stop();
      }
      this.onUpdate?.(this.value, completed);
    }
    /** Stop the animation */
    stop() {
      this.isRunning = false;
    }
    /**
     * Set up the animation from a starting value to an ending value
     * with optional parameters for lerping, duration, easing, and onUpdate callback
     *
     * @param from - The starting value
     * @param to - The ending value
     * @param options - Options for the animation
     */
    fromTo(from, to, { lerp: lerp2, duration, easing, onStart, onUpdate }) {
      this.from = this.value = from;
      this.to = to;
      this.lerp = lerp2;
      this.duration = duration;
      this.easing = easing;
      this.currentTime = 0;
      this.isRunning = true;
      onStart?.();
      this.onUpdate = onUpdate;
    }
  };
  function debounce(callback, delay) {
    let timer;
    return function(...args) {
      let context = this;
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = void 0;
        callback.apply(context, args);
      }, delay);
    };
  }
  var Dimensions = class {
    constructor(wrapper, content, { autoResize = true, debounce: debounceValue = 250 } = {}) {
      this.wrapper = wrapper;
      this.content = content;
      if (autoResize) {
        this.debouncedResize = debounce(this.resize, debounceValue);
        if (this.wrapper instanceof Window) {
          window.addEventListener("resize", this.debouncedResize, false);
        } else {
          this.wrapperResizeObserver = new ResizeObserver(this.debouncedResize);
          this.wrapperResizeObserver.observe(this.wrapper);
        }
        this.contentResizeObserver = new ResizeObserver(this.debouncedResize);
        this.contentResizeObserver.observe(this.content);
      }
      this.resize();
    }
    width = 0;
    height = 0;
    scrollHeight = 0;
    scrollWidth = 0;
    // These are instanciated in the constructor as they need information from the options
    debouncedResize;
    wrapperResizeObserver;
    contentResizeObserver;
    destroy() {
      this.wrapperResizeObserver?.disconnect();
      this.contentResizeObserver?.disconnect();
      if (this.wrapper === window && this.debouncedResize) {
        window.removeEventListener("resize", this.debouncedResize, false);
      }
    }
    resize = () => {
      this.onWrapperResize();
      this.onContentResize();
    };
    onWrapperResize = () => {
      if (this.wrapper instanceof Window) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
      } else {
        this.width = this.wrapper.clientWidth;
        this.height = this.wrapper.clientHeight;
      }
    };
    onContentResize = () => {
      if (this.wrapper instanceof Window) {
        this.scrollHeight = this.content.scrollHeight;
        this.scrollWidth = this.content.scrollWidth;
      } else {
        this.scrollHeight = this.wrapper.scrollHeight;
        this.scrollWidth = this.wrapper.scrollWidth;
      }
    };
    get limit() {
      return {
        x: this.scrollWidth - this.width,
        y: this.scrollHeight - this.height
      };
    }
  };
  var Emitter = class {
    events = {};
    /**
     * Emit an event with the given data
     * @param event Event name
     * @param args Data to pass to the event handlers
     */
    emit(event, ...args) {
      let callbacks = this.events[event] || [];
      for (let i2 = 0, length = callbacks.length; i2 < length; i2++) {
        callbacks[i2]?.(...args);
      }
    }
    /**
     * Add a callback to the event
     * @param event Event name
     * @param cb Callback function
     * @returns Unsubscribe function
     */
    on(event, cb) {
      this.events[event]?.push(cb) || (this.events[event] = [cb]);
      return () => {
        this.events[event] = this.events[event]?.filter((i2) => cb !== i2);
      };
    }
    /**
     * Remove a callback from the event
     * @param event Event name
     * @param callback Callback function
     */
    off(event, callback) {
      this.events[event] = this.events[event]?.filter((i2) => callback !== i2);
    }
    /**
     * Remove all event listeners and clean up
     */
    destroy() {
      this.events = {};
    }
  };
  var LINE_HEIGHT = 100 / 6;
  var listenerOptions = { passive: false };
  var VirtualScroll = class {
    constructor(element, options = { wheelMultiplier: 1, touchMultiplier: 1 }) {
      this.element = element;
      this.options = options;
      window.addEventListener("resize", this.onWindowResize, false);
      this.onWindowResize();
      this.element.addEventListener("wheel", this.onWheel, listenerOptions);
      this.element.addEventListener(
        "touchstart",
        this.onTouchStart,
        listenerOptions
      );
      this.element.addEventListener(
        "touchmove",
        this.onTouchMove,
        listenerOptions
      );
      this.element.addEventListener("touchend", this.onTouchEnd, listenerOptions);
    }
    touchStart = {
      x: 0,
      y: 0
    };
    lastDelta = {
      x: 0,
      y: 0
    };
    window = {
      width: 0,
      height: 0
    };
    emitter = new Emitter();
    /**
     * Add an event listener for the given event and callback
     *
     * @param event Event name
     * @param callback Callback function
     */
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    /** Remove all event listeners and clean up */
    destroy() {
      this.emitter.destroy();
      window.removeEventListener("resize", this.onWindowResize, false);
      this.element.removeEventListener("wheel", this.onWheel, listenerOptions);
      this.element.removeEventListener(
        "touchstart",
        this.onTouchStart,
        listenerOptions
      );
      this.element.removeEventListener(
        "touchmove",
        this.onTouchMove,
        listenerOptions
      );
      this.element.removeEventListener(
        "touchend",
        this.onTouchEnd,
        listenerOptions
      );
    }
    /**
     * Event handler for 'touchstart' event
     *
     * @param event Touch event
     */
    onTouchStart = (event) => {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
      this.touchStart.x = clientX;
      this.touchStart.y = clientY;
      this.lastDelta = {
        x: 0,
        y: 0
      };
      this.emitter.emit("scroll", {
        deltaX: 0,
        deltaY: 0,
        event
      });
    };
    /** Event handler for 'touchmove' event */
    onTouchMove = (event) => {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
      const deltaX = -(clientX - this.touchStart.x) * this.options.touchMultiplier;
      const deltaY = -(clientY - this.touchStart.y) * this.options.touchMultiplier;
      this.touchStart.x = clientX;
      this.touchStart.y = clientY;
      this.lastDelta = {
        x: deltaX,
        y: deltaY
      };
      this.emitter.emit("scroll", {
        deltaX,
        deltaY,
        event
      });
    };
    onTouchEnd = (event) => {
      this.emitter.emit("scroll", {
        deltaX: this.lastDelta.x,
        deltaY: this.lastDelta.y,
        event
      });
    };
    /** Event handler for 'wheel' event */
    onWheel = (event) => {
      let { deltaX, deltaY, deltaMode } = event;
      const multiplierX = deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.width : 1;
      const multiplierY = deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.height : 1;
      deltaX *= multiplierX;
      deltaY *= multiplierY;
      deltaX *= this.options.wheelMultiplier;
      deltaY *= this.options.wheelMultiplier;
      this.emitter.emit("scroll", { deltaX, deltaY, event });
    };
    onWindowResize = () => {
      this.window = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    };
  };
  var defaultEasing = (t2) => Math.min(1, 1.001 - Math.pow(2, -10 * t2));
  var Lenis = class {
    _isScrolling = false;
    // true when scroll is animating
    _isStopped = false;
    // true if user should not be able to scroll - enable/disable programmatically
    _isLocked = false;
    // same as isStopped but enabled/disabled when scroll reaches target
    _preventNextNativeScrollEvent = false;
    _resetVelocityTimeout = null;
    _rafId = null;
    /**
     * Whether or not the user is touching the screen
     */
    isTouching;
    /**
     * The time in ms since the lenis instance was created
     */
    time = 0;
    /**
     * User data that will be forwarded through the scroll event
     *
     * @example
     * lenis.scrollTo(100, {
     *   userData: {
     *     foo: 'bar'
     *   }
     * })
     */
    userData = {};
    /**
     * The last velocity of the scroll
     */
    lastVelocity = 0;
    /**
     * The current velocity of the scroll
     */
    velocity = 0;
    /**
     * The direction of the scroll
     */
    direction = 0;
    /**
     * The options passed to the lenis instance
     */
    options;
    /**
     * The target scroll value
     */
    targetScroll;
    /**
     * The animated scroll value
     */
    animatedScroll;
    // These are instanciated here as they don't need information from the options
    animate = new Animate();
    emitter = new Emitter();
    // These are instanciated in the constructor as they need information from the options
    dimensions;
    // This is not private because it's used in the Snap class
    virtualScroll;
    constructor({
      wrapper = window,
      content = document.documentElement,
      eventsTarget = wrapper,
      smoothWheel = true,
      syncTouch = false,
      syncTouchLerp = 0.075,
      touchInertiaExponent = 1.7,
      duration,
      // in seconds
      easing,
      lerp: lerp2 = 0.1,
      infinite = false,
      orientation = "vertical",
      // vertical, horizontal
      gestureOrientation = orientation === "horizontal" ? "both" : "vertical",
      // vertical, horizontal, both
      touchMultiplier = 1,
      wheelMultiplier = 1,
      autoResize = true,
      prevent,
      virtualScroll,
      overscroll = true,
      autoRaf = false,
      anchors = false,
      autoToggle = false,
      // https://caniuse.com/?search=transition-behavior
      allowNestedScroll = false,
      // @ts-ignore: this will be deprecated in the future
      __experimental__naiveDimensions = false,
      naiveDimensions = __experimental__naiveDimensions,
      stopInertiaOnNavigate = false
    } = {}) {
      window.lenisVersion = version;
      if (!wrapper || wrapper === document.documentElement) {
        wrapper = window;
      }
      if (typeof duration === "number" && typeof easing !== "function") {
        easing = defaultEasing;
      } else if (typeof easing === "function" && typeof duration !== "number") {
        duration = 1;
      }
      this.options = {
        wrapper,
        content,
        eventsTarget,
        smoothWheel,
        syncTouch,
        syncTouchLerp,
        touchInertiaExponent,
        duration,
        easing,
        lerp: lerp2,
        infinite,
        gestureOrientation,
        orientation,
        touchMultiplier,
        wheelMultiplier,
        autoResize,
        prevent,
        virtualScroll,
        overscroll,
        autoRaf,
        anchors,
        autoToggle,
        allowNestedScroll,
        naiveDimensions,
        stopInertiaOnNavigate
      };
      this.dimensions = new Dimensions(wrapper, content, { autoResize });
      this.updateClassName();
      this.targetScroll = this.animatedScroll = this.actualScroll;
      this.options.wrapper.addEventListener("scroll", this.onNativeScroll, false);
      this.options.wrapper.addEventListener("scrollend", this.onScrollEnd, {
        capture: true
      });
      if (this.options.anchors || this.options.stopInertiaOnNavigate) {
        this.options.wrapper.addEventListener(
          "click",
          this.onClick,
          false
        );
      }
      this.options.wrapper.addEventListener(
        "pointerdown",
        this.onPointerDown,
        false
      );
      this.virtualScroll = new VirtualScroll(eventsTarget, {
        touchMultiplier,
        wheelMultiplier
      });
      this.virtualScroll.on("scroll", this.onVirtualScroll);
      if (this.options.autoToggle) {
        this.checkOverflow();
        this.rootElement.addEventListener("transitionend", this.onTransitionEnd, {
          passive: true
        });
      }
      if (this.options.autoRaf) {
        this._rafId = requestAnimationFrame(this.raf);
      }
    }
    /**
     * Destroy the lenis instance, remove all event listeners and clean up the class name
     */
    destroy() {
      this.emitter.destroy();
      this.options.wrapper.removeEventListener(
        "scroll",
        this.onNativeScroll,
        false
      );
      this.options.wrapper.removeEventListener("scrollend", this.onScrollEnd, {
        capture: true
      });
      this.options.wrapper.removeEventListener(
        "pointerdown",
        this.onPointerDown,
        false
      );
      if (this.options.anchors || this.options.stopInertiaOnNavigate) {
        this.options.wrapper.removeEventListener(
          "click",
          this.onClick,
          false
        );
      }
      this.virtualScroll.destroy();
      this.dimensions.destroy();
      this.cleanUpClassName();
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
      }
    }
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    off(event, callback) {
      return this.emitter.off(event, callback);
    }
    onScrollEnd = (e2) => {
      if (!(e2 instanceof CustomEvent)) {
        if (this.isScrolling === "smooth" || this.isScrolling === false) {
          e2.stopPropagation();
        }
      }
    };
    dispatchScrollendEvent = () => {
      this.options.wrapper.dispatchEvent(
        new CustomEvent("scrollend", {
          bubbles: this.options.wrapper === window,
          // cancelable: false,
          detail: {
            lenisScrollEnd: true
          }
        })
      );
    };
    get overflow() {
      const property = this.isHorizontal ? "overflow-x" : "overflow-y";
      return getComputedStyle(this.rootElement)[property];
    }
    checkOverflow() {
      if (["hidden", "clip"].includes(this.overflow)) {
        this.internalStop();
      } else {
        this.internalStart();
      }
    }
    onTransitionEnd = (event) => {
      if (event.propertyName.includes("overflow")) {
        this.checkOverflow();
      }
    };
    setScroll(scroll) {
      if (this.isHorizontal) {
        this.options.wrapper.scrollTo({ left: scroll, behavior: "instant" });
      } else {
        this.options.wrapper.scrollTo({ top: scroll, behavior: "instant" });
      }
    }
    onClick = (event) => {
      const path = event.composedPath();
      const anchorElements = path.filter(
        (node) => node instanceof HTMLAnchorElement && node.getAttribute("href")
      );
      if (this.options.anchors) {
        const anchor = anchorElements.find(
          (node) => node.getAttribute("href")?.includes("#")
        );
        if (anchor) {
          const href = anchor.getAttribute("href");
          if (href) {
            const options = typeof this.options.anchors === "object" && this.options.anchors ? this.options.anchors : void 0;
            const target = `#${href.split("#")[1]}`;
            this.scrollTo(target, options);
          }
        }
      }
      if (this.options.stopInertiaOnNavigate) {
        const internalLink = anchorElements.find(
          (node) => node.host === window.location.host
        );
        if (internalLink) {
          this.reset();
        }
      }
    };
    onPointerDown = (event) => {
      if (event.button === 1) {
        this.reset();
      }
    };
    onVirtualScroll = (data) => {
      if (typeof this.options.virtualScroll === "function" && this.options.virtualScroll(data) === false)
        return;
      const { deltaX, deltaY, event } = data;
      this.emitter.emit("virtual-scroll", { deltaX, deltaY, event });
      if (event.ctrlKey) return;
      if (event.lenisStopPropagation) return;
      const isTouch = event.type.includes("touch");
      const isWheel = event.type.includes("wheel");
      this.isTouching = event.type === "touchstart" || event.type === "touchmove";
      const isClickOrTap = deltaX === 0 && deltaY === 0;
      const isTapToStop = this.options.syncTouch && isTouch && event.type === "touchstart" && isClickOrTap && !this.isStopped && !this.isLocked;
      if (isTapToStop) {
        this.reset();
        return;
      }
      const isUnknownGesture = this.options.gestureOrientation === "vertical" && deltaY === 0 || this.options.gestureOrientation === "horizontal" && deltaX === 0;
      if (isClickOrTap || isUnknownGesture) {
        return;
      }
      let composedPath = event.composedPath();
      composedPath = composedPath.slice(0, composedPath.indexOf(this.rootElement));
      const prevent = this.options.prevent;
      if (!!composedPath.find(
        (node) => node instanceof HTMLElement && (typeof prevent === "function" && prevent?.(node) || node.hasAttribute?.("data-lenis-prevent") || isTouch && node.hasAttribute?.("data-lenis-prevent-touch") || isWheel && node.hasAttribute?.("data-lenis-prevent-wheel") || this.options.allowNestedScroll && this.checkNestedScroll(node, { deltaX, deltaY }))
      ))
        return;
      if (this.isStopped || this.isLocked) {
        if (event.cancelable) {
          event.preventDefault();
        }
        return;
      }
      const isSmooth = this.options.syncTouch && isTouch || this.options.smoothWheel && isWheel;
      if (!isSmooth) {
        this.isScrolling = "native";
        this.animate.stop();
        event.lenisStopPropagation = true;
        return;
      }
      let delta = deltaY;
      if (this.options.gestureOrientation === "both") {
        delta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX;
      } else if (this.options.gestureOrientation === "horizontal") {
        delta = deltaX;
      }
      if (!this.options.overscroll || this.options.infinite || this.options.wrapper !== window && this.limit > 0 && (this.animatedScroll > 0 && this.animatedScroll < this.limit || this.animatedScroll === 0 && deltaY > 0 || this.animatedScroll === this.limit && deltaY < 0)) {
        event.lenisStopPropagation = true;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
      const isSyncTouch = isTouch && this.options.syncTouch;
      const isTouchEnd = isTouch && event.type === "touchend";
      const hasTouchInertia = isTouchEnd;
      if (hasTouchInertia) {
        delta = Math.sign(this.velocity) * Math.pow(Math.abs(this.velocity), this.options.touchInertiaExponent);
      }
      this.scrollTo(this.targetScroll + delta, {
        programmatic: false,
        ...isSyncTouch ? {
          lerp: hasTouchInertia ? this.options.syncTouchLerp : 1
        } : {
          lerp: this.options.lerp,
          duration: this.options.duration,
          easing: this.options.easing
        }
      });
    };
    /**
     * Force lenis to recalculate the dimensions
     */
    resize() {
      this.dimensions.resize();
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.emit();
    }
    emit() {
      this.emitter.emit("scroll", this);
    }
    onNativeScroll = () => {
      if (this._resetVelocityTimeout !== null) {
        clearTimeout(this._resetVelocityTimeout);
        this._resetVelocityTimeout = null;
      }
      if (this._preventNextNativeScrollEvent) {
        this._preventNextNativeScrollEvent = false;
        return;
      }
      if (this.isScrolling === false || this.isScrolling === "native") {
        const lastScroll = this.animatedScroll;
        this.animatedScroll = this.targetScroll = this.actualScroll;
        this.lastVelocity = this.velocity;
        this.velocity = this.animatedScroll - lastScroll;
        this.direction = Math.sign(
          this.animatedScroll - lastScroll
        );
        if (!this.isStopped) {
          this.isScrolling = "native";
        }
        this.emit();
        if (this.velocity !== 0) {
          this._resetVelocityTimeout = setTimeout(() => {
            this.lastVelocity = this.velocity;
            this.velocity = 0;
            this.isScrolling = false;
            this.emit();
          }, 400);
        }
      }
    };
    reset() {
      this.isLocked = false;
      this.isScrolling = false;
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.lastVelocity = this.velocity = 0;
      this.animate.stop();
    }
    /**
     * Start lenis scroll after it has been stopped
     */
    start() {
      if (!this.isStopped) return;
      if (this.options.autoToggle) {
        this.rootElement.style.removeProperty("overflow");
        return;
      }
      this.internalStart();
    }
    internalStart() {
      if (!this.isStopped) return;
      this.reset();
      this.isStopped = false;
      this.emit();
    }
    /**
     * Stop lenis scroll
     */
    stop() {
      if (this.isStopped) return;
      if (this.options.autoToggle) {
        this.rootElement.style.setProperty("overflow", "clip");
        return;
      }
      this.internalStop();
    }
    internalStop() {
      if (this.isStopped) return;
      this.reset();
      this.isStopped = true;
      this.emit();
    }
    /**
     * RequestAnimationFrame for lenis
     *
     * @param time The time in ms from an external clock like `requestAnimationFrame` or Tempus
     */
    raf = (time) => {
      const deltaTime = time - (this.time || time);
      this.time = time;
      this.animate.advance(deltaTime * 1e-3);
      if (this.options.autoRaf) {
        this._rafId = requestAnimationFrame(this.raf);
      }
    };
    /**
     * Scroll to a target value
     *
     * @param target The target value to scroll to
     * @param options The options for the scroll
     *
     * @example
     * lenis.scrollTo(100, {
     *   offset: 100,
     *   duration: 1,
     *   easing: (t) => 1 - Math.cos((t * Math.PI) / 2),
     *   lerp: 0.1,
     *   onStart: () => {
     *     console.log('onStart')
     *   },
     *   onComplete: () => {
     *     console.log('onComplete')
     *   },
     * })
     */
    scrollTo(target, {
      offset = 0,
      immediate = false,
      lock = false,
      programmatic = true,
      // called from outside of the class
      lerp: lerp2 = programmatic ? this.options.lerp : void 0,
      duration = programmatic ? this.options.duration : void 0,
      easing = programmatic ? this.options.easing : void 0,
      onStart,
      onComplete,
      force = false,
      // scroll even if stopped
      userData
    } = {}) {
      if ((this.isStopped || this.isLocked) && !force) return;
      if (typeof target === "string" && ["top", "left", "start", "#"].includes(target)) {
        target = 0;
      } else if (typeof target === "string" && ["bottom", "right", "end"].includes(target)) {
        target = this.limit;
      } else {
        let node;
        if (typeof target === "string") {
          node = document.querySelector(target);
          if (!node) {
            if (target === "#top") {
              target = 0;
            } else {
              console.warn("Lenis: Target not found", target);
            }
          }
        } else if (target instanceof HTMLElement && target?.nodeType) {
          node = target;
        }
        if (node) {
          if (this.options.wrapper !== window) {
            const wrapperRect = this.rootElement.getBoundingClientRect();
            offset -= this.isHorizontal ? wrapperRect.left : wrapperRect.top;
          }
          const rect = node.getBoundingClientRect();
          target = (this.isHorizontal ? rect.left : rect.top) + this.animatedScroll;
        }
      }
      if (typeof target !== "number") return;
      target += offset;
      target = Math.round(target);
      if (this.options.infinite) {
        if (programmatic) {
          this.targetScroll = this.animatedScroll = this.scroll;
          const distance = target - this.animatedScroll;
          if (distance > this.limit / 2) {
            target = target - this.limit;
          } else if (distance < -this.limit / 2) {
            target = target + this.limit;
          }
        }
      } else {
        target = clamp(0, target, this.limit);
      }
      if (target === this.targetScroll) {
        onStart?.(this);
        onComplete?.(this);
        return;
      }
      this.userData = userData ?? {};
      if (immediate) {
        this.animatedScroll = this.targetScroll = target;
        this.setScroll(this.scroll);
        this.reset();
        this.preventNextNativeScrollEvent();
        this.emit();
        onComplete?.(this);
        this.userData = {};
        requestAnimationFrame(() => {
          this.dispatchScrollendEvent();
        });
        return;
      }
      if (!programmatic) {
        this.targetScroll = target;
      }
      if (typeof duration === "number" && typeof easing !== "function") {
        easing = defaultEasing;
      } else if (typeof easing === "function" && typeof duration !== "number") {
        duration = 1;
      }
      this.animate.fromTo(this.animatedScroll, target, {
        duration,
        easing,
        lerp: lerp2,
        onStart: () => {
          if (lock) this.isLocked = true;
          this.isScrolling = "smooth";
          onStart?.(this);
        },
        onUpdate: (value, completed) => {
          this.isScrolling = "smooth";
          this.lastVelocity = this.velocity;
          this.velocity = value - this.animatedScroll;
          this.direction = Math.sign(this.velocity);
          this.animatedScroll = value;
          this.setScroll(this.scroll);
          if (programmatic) {
            this.targetScroll = value;
          }
          if (!completed) this.emit();
          if (completed) {
            this.reset();
            this.emit();
            onComplete?.(this);
            this.userData = {};
            requestAnimationFrame(() => {
              this.dispatchScrollendEvent();
            });
            this.preventNextNativeScrollEvent();
          }
        }
      });
    }
    preventNextNativeScrollEvent() {
      this._preventNextNativeScrollEvent = true;
      requestAnimationFrame(() => {
        this._preventNextNativeScrollEvent = false;
      });
    }
    checkNestedScroll(node, { deltaX, deltaY }) {
      const time = Date.now();
      const cache = node._lenis ??= {};
      let hasOverflowX, hasOverflowY, isScrollableX, isScrollableY, scrollWidth, scrollHeight, clientWidth, clientHeight;
      const gestureOrientation = this.options.gestureOrientation;
      if (time - (cache.time ?? 0) > 2e3) {
        cache.time = Date.now();
        const computedStyle = window.getComputedStyle(node);
        cache.computedStyle = computedStyle;
        const overflowXString = computedStyle.overflowX;
        const overflowYString = computedStyle.overflowY;
        hasOverflowX = ["auto", "overlay", "scroll"].includes(overflowXString);
        hasOverflowY = ["auto", "overlay", "scroll"].includes(overflowYString);
        cache.hasOverflowX = hasOverflowX;
        cache.hasOverflowY = hasOverflowY;
        if (!hasOverflowX && !hasOverflowY) return false;
        if (gestureOrientation === "vertical" && !hasOverflowY) return false;
        if (gestureOrientation === "horizontal" && !hasOverflowX) return false;
        scrollWidth = node.scrollWidth;
        scrollHeight = node.scrollHeight;
        clientWidth = node.clientWidth;
        clientHeight = node.clientHeight;
        isScrollableX = scrollWidth > clientWidth;
        isScrollableY = scrollHeight > clientHeight;
        cache.isScrollableX = isScrollableX;
        cache.isScrollableY = isScrollableY;
        cache.scrollWidth = scrollWidth;
        cache.scrollHeight = scrollHeight;
        cache.clientWidth = clientWidth;
        cache.clientHeight = clientHeight;
      } else {
        isScrollableX = cache.isScrollableX;
        isScrollableY = cache.isScrollableY;
        hasOverflowX = cache.hasOverflowX;
        hasOverflowY = cache.hasOverflowY;
        scrollWidth = cache.scrollWidth;
        scrollHeight = cache.scrollHeight;
        clientWidth = cache.clientWidth;
        clientHeight = cache.clientHeight;
      }
      if (!hasOverflowX && !hasOverflowY || !isScrollableX && !isScrollableY) {
        return false;
      }
      if (gestureOrientation === "vertical" && (!hasOverflowY || !isScrollableY))
        return false;
      if (gestureOrientation === "horizontal" && (!hasOverflowX || !isScrollableX))
        return false;
      let orientation;
      if (gestureOrientation === "horizontal") {
        orientation = "x";
      } else if (gestureOrientation === "vertical") {
        orientation = "y";
      } else {
        const isScrollingX = deltaX !== 0;
        const isScrollingY = deltaY !== 0;
        if (isScrollingX && hasOverflowX && isScrollableX) {
          orientation = "x";
        }
        if (isScrollingY && hasOverflowY && isScrollableY) {
          orientation = "y";
        }
      }
      if (!orientation) return false;
      let scroll, maxScroll, delta, hasOverflow, isScrollable;
      if (orientation === "x") {
        scroll = node.scrollLeft;
        maxScroll = scrollWidth - clientWidth;
        delta = deltaX;
        hasOverflow = hasOverflowX;
        isScrollable = isScrollableX;
      } else if (orientation === "y") {
        scroll = node.scrollTop;
        maxScroll = scrollHeight - clientHeight;
        delta = deltaY;
        hasOverflow = hasOverflowY;
        isScrollable = isScrollableY;
      } else {
        return false;
      }
      const willScroll = delta > 0 ? scroll < maxScroll : scroll > 0;
      return willScroll && hasOverflow && isScrollable;
    }
    /**
     * The root element on which lenis is instanced
     */
    get rootElement() {
      return this.options.wrapper === window ? document.documentElement : this.options.wrapper;
    }
    /**
     * The limit which is the maximum scroll value
     */
    get limit() {
      if (this.options.naiveDimensions) {
        if (this.isHorizontal) {
          return this.rootElement.scrollWidth - this.rootElement.clientWidth;
        } else {
          return this.rootElement.scrollHeight - this.rootElement.clientHeight;
        }
      } else {
        return this.dimensions.limit[this.isHorizontal ? "x" : "y"];
      }
    }
    /**
     * Whether or not the scroll is horizontal
     */
    get isHorizontal() {
      return this.options.orientation === "horizontal";
    }
    /**
     * The actual scroll value
     */
    get actualScroll() {
      const wrapper = this.options.wrapper;
      return this.isHorizontal ? wrapper.scrollX ?? wrapper.scrollLeft : wrapper.scrollY ?? wrapper.scrollTop;
    }
    /**
     * The current scroll value
     */
    get scroll() {
      return this.options.infinite ? modulo(this.animatedScroll, this.limit) : this.animatedScroll;
    }
    /**
     * The progress of the scroll relative to the limit
     */
    get progress() {
      return this.limit === 0 ? 1 : this.scroll / this.limit;
    }
    /**
     * Current scroll state
     */
    get isScrolling() {
      return this._isScrolling;
    }
    set isScrolling(value) {
      if (this._isScrolling !== value) {
        this._isScrolling = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is stopped
     */
    get isStopped() {
      return this._isStopped;
    }
    set isStopped(value) {
      if (this._isStopped !== value) {
        this._isStopped = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is locked
     */
    get isLocked() {
      return this._isLocked;
    }
    set isLocked(value) {
      if (this._isLocked !== value) {
        this._isLocked = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is smooth scrolling
     */
    get isSmooth() {
      return this.isScrolling === "smooth";
    }
    /**
     * The class name applied to the wrapper element
     */
    get className() {
      let className = "lenis";
      if (this.options.autoToggle) className += " lenis-autoToggle";
      if (this.isStopped) className += " lenis-stopped";
      if (this.isLocked) className += " lenis-locked";
      if (this.isScrolling) className += " lenis-scrolling";
      if (this.isScrolling === "smooth") className += " lenis-smooth";
      return className;
    }
    updateClassName() {
      this.cleanUpClassName();
      this.rootElement.className = `${this.rootElement.className} ${this.className}`.trim();
    }
    cleanUpClassName() {
      this.rootElement.className = this.rootElement.className.replace(/lenis(-\w+)?/g, "").trim();
    }
  };

  // js/Button.js
  var Button = class {
    constructor(element) {
      this.element = element;
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this.elements();
          this.splitWords();
          this.bind();
        });
      }
    }
    elements() {
      this.text = this.element.querySelector("div");
    }
    splitWords() {
      this.splitText = new SplitText(this.text, {
        type: "chars"
      });
    }
    bind() {
      this.element.addEventListener("mouseenter", () => {
        const tl = gsap.timeline();
        tl.to(this.splitText.chars, {
          duration: 1,
          rotate: (index) => -10 + index / this.splitText.chars.length * 20,
          x: (index) => -5 + index / this.splitText.chars.length * 10,
          y: (index) => -5 * Math.abs(index - this.splitText.chars.length / 2) / (this.splitText.chars.length / 2),
          ease: "elastic.out(1, 0.3)",
          stagger: {
            amount: 0.6
          },
          scaleY: 0.5,
          transformOrigin: "center top"
        });
        tl.to(this.splitText.chars, {
          duration: 1,
          rotate: 0,
          x: 0,
          y: 0,
          ease: "elastic.out(1, 0.3)",
          overwrite: "auto",
          scaleY: 1,
          stagger: {
            amount: 0.6
          }
        }, "<0.3");
      });
    }
  };

  // js/Roller.js
  var Roller = class {
    constructor(element) {
      this.element = element;
      this.position = 0;
      this.elements();
      this.loader();
    }
    elements() {
      this.logos = this.element.querySelectorAll("img");
      this.logos.forEach((logo) => {
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
      };
      this.logos.forEach((logo) => {
        if (logo.complete) {
          this.loaded = true;
          logosLoaded++;
          checkIfAllLoaded();
        } else {
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
      this.logos.forEach((logo) => {
        logo.startingWidth = logo.offsetWidth;
        logo.startingX = logo.offsetLeft - this.element.offsetLeft;
        logo.loop = 0;
      });
      let widestLogoWidth = 0;
      this.logos.forEach((logo) => {
        if (logo.offsetWidth > widestLogoWidth) {
          widestLogoWidth = logo.offsetWidth;
        }
      });
      gsap.set(this.element, {
        width: Math.min(document.body.offsetWidth, this.totalWidth - widestLogoWidth)
      });
    }
    update() {
      this.ticker = () => {
        this.position -= 0.5;
        this.logos.forEach((logo, index) => {
          if (-this.position > logo.startingWidth + logo.startingX + logo.loop * this.totalWidth) {
            logo.loop++;
          }
          gsap.set(logo, {
            x: logo.loop * this.totalWidth + this.position
          });
        });
      };
      gsap.ticker.add(this.ticker);
    }
  };

  // js/Hex.js
  var Hex = class {
    constructor(element) {
      this.element = element;
      this.hexQ = 32;
      this.elements();
      this.build();
      this.place();
      this.sizing();
      this.animate();
      window.addEventListener("resize", this.sizing.bind(this));
    }
    elements() {
      this.bg = document.createElement("div");
      this.bgWrapper = document.createElement("div");
      this.bgWrapper.classList.add("bg-wrapper");
      this.bg.classList.add("bg");
      this.element.appendChild(this.bgWrapper);
      this.bgWrapper.appendChild(this.bg);
    }
    build() {
      for (let i2 = 0; i2 < this.hexQ; i2++) {
        const hex = document.createElement("div");
        hex.classList.add("hex");
        this.bg.appendChild(hex);
      }
      this.hexes = this.bg.querySelectorAll(".hex");
    }
    place() {
      const bgColor = getComputedStyle(this.hexes[0]).backgroundColor;
      const rgb = bgColor.match(/\d+/g).map(Number);
      this.hexes.forEach((hex, index) => {
        const col = index % 8;
        const row = Math.floor(index / 8);
        const rVar = Math.random() * 10;
        const gVar = Math.random() * 140 - 30;
        const bVar = Math.random() * 10;
        gsap.set(hex, {
          xPercent: col * (93.3 - 6.7) - 6.7 + (93.3 - 6.7) / (row % 2 ? -4 : 4),
          yPercent: row * 75,
          backgroundColor: `rgb(${Math.max(0, Math.min(255, rgb[0] + rVar))}, ${Math.max(0, Math.min(255, rgb[1] + gVar))}, ${Math.max(0, Math.min(255, rgb[2] + bVar))})`
        });
      });
    }
    sizing() {
      gsap.set(this.hexes, {
        width: this.bgWrapper.offsetHeight / 2
      });
      gsap.set(this.bg, {
        height: this.hexes[0].getBoundingClientRect().height + this.hexes[0].getBoundingClientRect().height * 3 * 0.75,
        width: this.hexes[0].getBoundingClientRect().width * 8 * 0.866
      });
    }
    animate() {
      gsap.from(this.hexes, {
        opacity: 0,
        scale: 0.7,
        duration: 2,
        ease: "elastic.out(1, 0.3)",
        stagger: {
          grid: "auto",
          from: "center",
          each: 0.05,
          onComplete: function() {
            gsap.to(this._targets[0], {
              opacity: 0,
              yoyo: true,
              duration: "random(0.5, 5)",
              delay: "random(0, 2)",
              repeat: -1
            });
          }
        },
        delay: 2
      });
      const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, delay: 2 });
      tl.to(this.hexes, {
        opacity: 0,
        // yoyo: true,
        ease: "power2.inOut",
        duration: "random(0.5, 5)",
        delay: "random(1.3, 2)",
        repeatDelay: "random(1.3, 2)"
      });
    }
  };

  // js/MovingHex.js
  var MovingHex = class {
    constructor(element) {
      this.element = element;
      this.slot = this.element.querySelector(".slot");
      this.create();
      this.position();
      this.animate();
    }
    create() {
      const hexQ = 48;
      this.hexWrapper = [document.createElement("div"), document.createElement("div")];
      this.hexWrapper.forEach((wrapper) => {
        wrapper.classList.add("hex-wrapper");
        if (this.slot) {
          this.slot.appendChild(wrapper);
          gsap.set(this.slot, { position: "relative" });
        } else {
          this.element.appendChild(wrapper);
        }
      });
      gsap.set(this.hexWrapper[1], {
        scaleX: -1,
        y: "-6rem"
      });
      for (let i2 = 0; i2 < hexQ; i2++) {
        const hexController = document.createElement("div");
        hexController.classList.add("hex-controller");
        const hex = document.createElement("div");
        hex.classList.add("hex");
        hexController.appendChild(hex);
        if (i2 < 24) {
          this.hexWrapper[0].appendChild(hexController);
        } else {
          this.hexWrapper[1].appendChild(hexController);
        }
      }
      this.hexWrapper.forEach((wrapper) => {
        wrapper.controllers = wrapper.querySelectorAll(".hex-controller");
      });
    }
    position() {
      this.hexWrapper.forEach((wrapper) => {
        wrapper.controllers.forEach((controller, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);
          gsap.set(controller, {
            xPercent: ((col - 1) * (93.3 - 6.7) - 6.7 + (93.3 - 6.7) / (row % 2 ? -4 : 4)) * 1.1,
            yPercent: row * 75 * 1.1
          });
        });
      });
    }
    animate() {
      this.hexWrapper.forEach((wrapper) => {
        wrapper.controllers.forEach((controller, index) => {
          const hex = controller.querySelector(".hex");
          const duration = 3;
          gsap.to(hex, {
            xPercent: (93.3 - 6.7) * 1.09,
            ease: "none",
            duration,
            repeat: -1
          });
          if (index % 4 === 0) {
            gsap.from(hex, {
              autoAlpha: 0,
              rotate: -180,
              duration: duration - 1,
              ease: "elastic.out(1, 0.9)",
              repeat: -1,
              scale: 0.5,
              repeatDelay: duration - 2
            });
          }
          if (index % 4 === 1) {
            gsap.to(hex, {
              scale: 0.8,
              duration,
              ease: "none",
              repeat: -1
            });
          }
          if (index % 4 === 2) {
            gsap.fromTo(hex, {
              scale: 0.8
            }, {
              duration,
              ease: "none",
              repeat: -1,
              scale: 0.6
            });
          }
          if (index % 4 === 3) {
            gsap.fromTo(hex, {
              autoAlpha: 1,
              scale: 0.6
            }, {
              autoAlpha: 0,
              duration,
              ease: "none",
              repeat: -1,
              scale: 0.5,
              rotate: 180
            });
          }
        });
      });
    }
  };

  // js/InteractiveHex.js
  var InteractiveHex = class {
    constructor(element) {
      this.element = element;
      this.canvas = null;
      this.gl = null;
      this.program = null;
      this.time = 0;
      this.mouseWorldX = 0;
      this.mouseWorldY = 0;
      this.isMouseOver = false;
      this.hoverZBoost = 0.5;
      this.hoverRadius = 3;
      this.animationSpeed = 0.3;
      this.zRange = 0.25;
      this.init();
    }
    init() {
      this.createCanvas();
      this.setupWebGL();
      this.createShaderProgram();
      this.setupBuffers();
      this.generateHexagons();
      this.setupMouseInteraction();
      this.animate();
    }
    createCanvas() {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "glCanvas";
      this.canvas.style.position = "absolute";
      this.canvas.style.top = "0";
      this.canvas.style.left = "0";
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
      this.element.style.position = "relative";
      this.element.appendChild(this.canvas);
      this.resize();
      window.addEventListener("resize", () => this.resize());
    }
    resize() {
      const rect = this.element.getBoundingClientRect();
      const canvasWidth = Math.floor(rect.width * 0.8);
      const canvasHeight = Math.floor(rect.height * 0.8);
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      if (this.gl) {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      }
      if (this.canvas.width > 0 && this.canvas.height > 0) {
        this.generateHexagons();
      }
    }
    setupWebGL() {
      this.gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
      if (!this.gl) {
        console.error("WebGL not supported");
        return;
      }
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.blendEquation(this.gl.FUNC_ADD);
      this.gl.clearColor(0.05, 0.05, 0.05, 1);
    }
    createShaderProgram() {
      const vertexShaderSource = `
            precision mediump float;
            
            attribute vec3 a_position;
            attribute vec3 a_normal;
            
            uniform mat4 u_modelViewMatrix;
            uniform mat4 u_projectionMatrix;
            uniform float u_time;
            uniform float u_zOffset;
            uniform float u_isShadow;
            uniform float u_scale;
            
            varying vec3 v_normal;
            varying vec3 v_position;
            varying float v_zDepth;
            varying vec2 v_originalPos;
            
            void main() {
                vec3 position = a_position;
                v_originalPos = a_position.xy;
                position.xy *= u_scale;
                
                if (u_isShadow > 0.5) {
                    position.xy *= 1.05;
                } else {
                    position.xy *= 0.97; // More visible embed effect
                }
                
                vec4 worldPosition = u_modelViewMatrix * vec4(position, 1.0);
                
                if (u_isShadow > 0.5) {
                    worldPosition.z += u_zOffset + 0.1;
                    worldPosition.x += 0.02;
                    worldPosition.y -= 0.02;
                } else {
                    worldPosition.z += u_zOffset;
                }
                
                v_position = worldPosition.xyz;
                v_normal = a_normal;
                v_zDepth = worldPosition.z;
                
                gl_Position = u_projectionMatrix * worldPosition;
            }
        `;
      const fragmentShaderSource = `
            precision mediump float;
            
            varying vec3 v_normal;
            varying vec3 v_position;
            varying float v_zDepth;
            varying vec2 v_originalPos;
            
            uniform float u_time;
            uniform float u_baseGray;
            uniform float u_isShadow;
            
            void main() {
                if (u_isShadow >= 0.5) {
                    float shadowAlpha = 0.3;
                    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
                } else {
                    vec3 baseColor = vec3(u_baseGray);
                    
                    float normalizedZ = clamp((v_zDepth + 20.0) / 0.15, 0.0, 1.0);
                    float shadowIntensity = 1.0 - normalizedZ * 0.2;
                    
                    vec3 lightDir = normalize(vec3(0.3, 0.4, 1.0));
                    float light = dot(normalize(v_normal), lightDir);
                    
                    // Rim lighting for embed effect - more obvious at top
                    vec2 pos = v_originalPos;
                    float hexRadius = 0.192;
                    float angle = atan(pos.y, pos.x);
                    float distFromCenter = length(pos);
                    float normalizedAngle = mod(angle + 1.5708, 1.0472);
                    float expectedRadius = hexRadius / cos(normalizedAngle - 0.5236);
                    float edgeDist = expectedRadius - distFromCenter;
                    
                    // Make edge detection tighter for 1px effect
                    float edgeFactor = smoothstep(0.0, hexRadius * 0.02, edgeDist);
                    
                    // Emphasize top edge (angle near -90 degrees / 1.5708)
                    float topEdgeFactor = 1.0 - clamp(abs(angle + 1.5708) / 0.5, 0.0, 1.0); // Stronger at top
                    
                    // Combine edge detection with top emphasis - clamp to prevent flares
                    float rimLight = clamp(edgeFactor * 0.25 * (0.5 + topEdgeFactor * 0.5), 0.0, 0.3);
                    
                    light = light * 0.5 + 0.5;
                    light = max(light, 0.3);
                    light = min(light + rimLight, 1.0); // Clamp to prevent over-brightening
                    
                    vec3 finalColor = baseColor * shadowIntensity * light;
                    finalColor = max(finalColor, vec3(0.05));
                    finalColor = finalColor * 1.1; // 10% brighter overall
                    finalColor = min(finalColor, vec3(1.0)); // Clamp to prevent over-brightening
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            }
        `;
      const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
      this.program = this.createProgram(vertexShader, fragmentShader);
      if (!this.program) {
        console.error("Failed to create shader program");
        return;
      }
      this.gl.useProgram(this.program);
      this.positionLocation = this.gl.getAttribLocation(this.program, "a_position");
      this.normalLocation = this.gl.getAttribLocation(this.program, "a_normal");
      this.modelViewMatrixLocation = this.gl.getUniformLocation(this.program, "u_modelViewMatrix");
      this.projectionMatrixLocation = this.gl.getUniformLocation(this.program, "u_projectionMatrix");
      this.timeLocation = this.gl.getUniformLocation(this.program, "u_time");
      this.zOffsetLocation = this.gl.getUniformLocation(this.program, "u_zOffset");
      this.baseGrayLocation = this.gl.getUniformLocation(this.program, "u_baseGray");
      this.isShadowLocation = this.gl.getUniformLocation(this.program, "u_isShadow");
      this.scaleLocation = this.gl.getUniformLocation(this.program, "u_scale");
    }
    compileShader(type, source) {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
        return null;
      }
      return shader;
    }
    createProgram(vertexShader, fragmentShader) {
      const program = this.gl.createProgram();
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);
      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        console.error("Program linking error:", this.gl.getProgramInfoLog(program));
        this.gl.deleteProgram(program);
        return null;
      }
      return program;
    }
    createHexagon() {
      const vertices = [];
      const normals = [];
      const indices = [];
      const radius = 0.192;
      const center = [0, 0, 0];
      vertices.push(...center);
      normals.push(0, 0, 1);
      for (let i2 = 0; i2 < 6; i2++) {
        const angle = Math.PI / 3 * i2 - Math.PI / 2;
        const x = center[0] + radius * Math.cos(angle);
        const y = center[1] + radius * Math.sin(angle);
        const z = center[2];
        vertices.push(x, y, z);
        normals.push(0, 0, 1);
      }
      for (let i2 = 0; i2 < 6; i2++) {
        indices.push(0, (i2 + 1) % 6 + 1, i2 + 1);
      }
      return { vertices, normals, indices };
    }
    calculateGridSize() {
      const cameraZ = -20;
      const fov = Math.PI / 15;
      const distance = Math.abs(cameraZ);
      const aspect = this.canvas.width / this.canvas.height;
      const tanHalfFov = Math.tan(fov / 2);
      const visibleHeight = tanHalfFov * distance * 2;
      const visibleWidth = visibleHeight * aspect;
      const hexRadius = 0.192;
      const hexWidth = hexRadius * Math.sqrt(3);
      const hexHeight = hexRadius * 1.5;
      const cols = Math.ceil(visibleWidth * 1.2 / hexWidth);
      const rows = Math.ceil(visibleHeight * 1.2 / hexHeight);
      return { rows, cols, hexWidth, hexHeight };
    }
    generateHexCombPattern(rows, cols, hexWidth, hexHeight) {
      const hexagons = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const xOffset = row % 2 * (hexWidth / 2);
          const x = col * hexWidth + xOffset - cols * hexWidth / 2;
          const y = row * hexHeight - rows * hexHeight / 2;
          const z = 0;
          const minGray = 0.033 * 1.1;
          const maxGray = (0.033 + 0.099) * 0.9;
          const baseGray = minGray + Math.random() * (maxGray - minGray);
          const phaseOffset = Math.random() * Math.PI * 2;
          hexagons.push({
            x,
            y,
            z,
            baseGray,
            phaseOffset
          });
        }
      }
      return hexagons;
    }
    setupBuffers() {
      const hexData = this.createHexagon();
      this.hexData = hexData;
      this.hexVertexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexVertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(hexData.vertices), this.gl.STATIC_DRAW);
      this.hexNormalBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexNormalBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(hexData.normals), this.gl.STATIC_DRAW);
      this.hexIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.hexIndexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(hexData.indices), this.gl.STATIC_DRAW);
    }
    generateHexagons() {
      if (!this.canvas || !this.canvas.width || !this.canvas.height) {
        this.hexagons = this.generateHexCombPattern(30, 40, 0.192 * Math.sqrt(3), 0.192 * 1.5);
        return;
      }
      const { rows, cols, hexWidth, hexHeight } = this.calculateGridSize();
      this.hexagons = this.generateHexCombPattern(rows, cols, hexWidth, hexHeight);
    }
    createPerspectiveMatrix(fov, aspect, near, far) {
      const f2 = 1 / Math.tan(fov / 2);
      const rangeInv = 1 / (near - far);
      return [
        f2 / aspect,
        0,
        0,
        0,
        0,
        f2,
        0,
        0,
        0,
        0,
        (near + far) * rangeInv,
        -1,
        0,
        0,
        near * far * rangeInv * 2,
        0
      ];
    }
    createOrthographicMatrix(left, right, bottom, top, near, far) {
      const lr = 1 / (left - right);
      const bt = 1 / (bottom - top);
      const nf = 1 / (near - far);
      return [
        -2 * lr,
        0,
        0,
        0,
        0,
        -2 * bt,
        0,
        0,
        0,
        0,
        2 * nf,
        0,
        (left + right) * lr,
        (top + bottom) * bt,
        (far + near) * nf,
        1
      ];
    }
    createModelViewMatrix(x, y, z) {
      const cameraZ = -20;
      return [
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        x,
        y,
        z + cameraZ,
        1
      ];
    }
    setupMouseInteraction() {
      const updateMousePosition = (e2) => {
        const rect = this.element.getBoundingClientRect();
        const x = e2.clientX - rect.left;
        const y = e2.clientY - rect.top;
        const clampedX = Math.max(0, Math.min(rect.width, x));
        const clampedY = Math.max(0, Math.min(rect.height, y));
        const canvasX = clampedX / rect.width * this.canvas.width;
        const canvasY = clampedY / rect.height * this.canvas.height;
        const ndcX = canvasX / this.canvas.width * 2 - 1;
        const ndcY = 1 - canvasY / this.canvas.height * 2;
        const aspect = this.canvas.width / this.canvas.height;
        const fov = Math.PI / 15;
        const cameraZ = -20;
        const distance = Math.abs(cameraZ);
        const tanHalfFov = Math.tan(fov / 2);
        this.mouseWorldY = tanHalfFov * distance * ndcY;
        this.mouseWorldX = tanHalfFov * distance * aspect * ndcX;
        this.isMouseOver = true;
      };
      document.addEventListener("mousemove", updateMousePosition);
    }
    getHoverEffect(hexX, hexY, baseZOffset) {
      if (!this.isMouseOver) return { zBoost: 0, scale: 1 };
      const dx = this.mouseWorldX - hexX;
      const dy = this.mouseWorldY - hexY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.hoverRadius) {
        const factor = 1 - dist / this.hoverRadius;
        const easedFactor = factor * factor * factor;
        const targetZ = this.zRange + this.hoverZBoost;
        const currentZ = baseZOffset;
        const zBoost = (targetZ - currentZ) * easedFactor;
        return {
          zBoost,
          scale: 1
        };
      }
      return { zBoost: 0, scale: 1 };
    }
    animate() {
      this.time += 8e-3;
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      const aspect = this.canvas.width / this.canvas.height;
      const fov = Math.PI / 15;
      const projectionMatrix = this.createPerspectiveMatrix(fov, aspect, 0.1, 100);
      this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);
      this.gl.uniform1f(this.timeLocation, this.time);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexVertexBuffer);
      this.gl.enableVertexAttribArray(this.positionLocation);
      this.gl.vertexAttribPointer(this.positionLocation, 3, this.gl.FLOAT, false, 0, 0);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexNormalBuffer);
      this.gl.enableVertexAttribArray(this.normalLocation);
      this.gl.vertexAttribPointer(this.normalLocation, 3, this.gl.FLOAT, false, 0, 0);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.hexIndexBuffer);
      this.gl.depthMask(true);
      this.gl.uniform1f(this.isShadowLocation, 0);
      this.hexagons.forEach((hex) => {
        const baseZOffset = Math.sin(this.time * this.animationSpeed + hex.phaseOffset) * this.zRange;
        const hoverEffect = this.getHoverEffect(hex.x, hex.y, baseZOffset);
        const zOffset = baseZOffset + hoverEffect.zBoost;
        const modelViewMatrix = this.createModelViewMatrix(hex.x, hex.y, hex.z);
        this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, modelViewMatrix);
        this.gl.uniform1f(this.zOffsetLocation, zOffset);
        this.gl.uniform1f(this.baseGrayLocation, hex.baseGray);
        this.gl.uniform1f(this.scaleLocation, hoverEffect.scale);
        this.gl.drawElements(this.gl.TRIANGLES, this.hexData.indices.length, this.gl.UNSIGNED_SHORT, 0);
      });
      requestAnimationFrame(() => this.animate());
    }
  };

  // js/Diction.js
  var Diction = class {
    constructor(element) {
      return;
      gsap.registerPlugin(CustomEase, CustomBounce);
      this.element = element;
      this.elements();
      this.create();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this.split();
          this.animate();
        });
      } else {
        this.split();
        this.animate();
      }
    }
    elements() {
      this.text = this.element.querySelector(".anim-diction");
      this.color1 = getComputedStyle(this.text).getPropertyValue("--color1");
      this.color2 = getComputedStyle(this.text).getPropertyValue("--color2");
    }
    create() {
      this.dot = document.createElement("div");
      this.dot.classList.add("dot");
      this.text.appendChild(this.dot);
    }
    split() {
      this.splitText = new SplitText(this.text, {
        type: "words, chars",
        classes: "char"
      });
      splitTextGradient(this.text, this.splitText.chars);
    }
    animate() {
      gsap.set(this.dot, {
        autoAlpha: 0,
        backgroundColor: this.color1
      });
      gsap.set(this.splitText.chars, {
        opacity: 0,
        scaleY: 0,
        transformOrigin: this.direction === "over" ? "center top" : "center bottom"
      });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: this.text,
          start: "top 90%",
          end: "bottom 30%"
        }
      });
      tl.to(this.splitText.chars, {
        opacity: 1,
        scaleY: 1,
        duration: 1,
        stagger: {
          amount: 1
        },
        ease: "elastic.out(1, 0.7)"
      }, 0);
      tl.to(this.dot, {
        autoAlpha: 1,
        duration: 0.2,
        ease: "none"
      }, 0);
      tl.to(this.dot, {
        left: "calc(100% - 0.5rem)",
        backgroundColor: this.color2,
        duration: 2,
        // ease: "none",
        ease: "power1.out"
      }, 0);
      tl.fromTo(this.dot, {
        top: this.direction === "over" ? "-40%" : "140%"
      }, {
        top: this.direction === "over" ? "20%" : "80%",
        duration: 4,
        ease: "bounce({strength:4, endAtStart:false})"
      }, 0);
      tl.to(this.dot, {
        autoAlpha: 0,
        duration: 0.2,
        ease: "none"
      }, 1.8);
    }
  };

  // js/Megamenu.js
  var Megamenu = class {
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
        autoAlpha: 0
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
      this.links.forEach((link) => {
        link.addEventListener("mouseenter", () => {
          if (!this.isShowing) return;
          this.isShowing = false;
          this.showMegamenu(false);
          if (this.currentTarget !== null) {
            this.menuLinks[this.currentTarget].classList.remove("active");
          }
        });
        link.addEventListener("click", (e2) => {
          if (this.isMobileMenuOpen) {
            this.openMobileMenu(false);
          }
        });
      });
      this.productsMobileLink.addEventListener("click", () => {
        this.productsMobile.classList.toggle("active");
        const open = this.productsMobile.classList.contains("active");
        gsap.to(this.productsMobileLink.querySelector("div"), {
          scaleY: open ? -1 : 1
        });
      });
      this.mobileToggler.addEventListener("click", () => {
        this.openMobileMenu(!this.isMobileMenuOpen);
      });
      this.menu.addEventListener("mouseenter", (e2) => {
        e2.preventDefault();
      });
    }
    observe() {
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
          xPercent: this.currentTarget !== null ? this.currentTarget > newIndex ? -100 : 100 : 0
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
        y: show ? 0 : -30
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
            padding: "1rem 0"
          });
        } else if (window.lenis.targetScroll <= 0 && this.menuSmall) {
          this.menuSmall = false;
          gsap.to(this.logo, {
            // reset padding
            padding: "2.125rem 0"
          });
        }
      };
      gsap.ticker.add(this.ticker);
    }
    openMobileMenu(open) {
      gsap.set(this.mobileClose, {
        autoAlpha: open ? 0 : 1,
        scale: open ? 0 : 1,
        yPercent: open ? 100 : 0,
        overwrite: true,
        rotate: open ? 45 : 0
      });
      gsap.to(this.mobileOpen, {
        scaleX: open ? 0 : 1,
        transformOrigin: "right center",
        duration: 1,
        ease: "power4.inOut"
      });
      gsap.to(this.mobileClose, {
        autoAlpha: open ? 1 : 0,
        duration: 1,
        scale: open ? 1 : 0,
        yPercent: open ? 0 : 100,
        ease: "elastic.out(1, 0.7)",
        delay: open ? 0.6 : 0,
        rotate: open ? 0 : 45
      });
      gsap.set(this.mobileMenu, {
        clipPath: open ? "inset(0% 0% 100% 0%)" : "inset(0% 0% 0% 0%)",
        autoAlpha: open ? 1 : 1,
        overwrite: true
      });
      gsap.to(this.mobileMenu, {
        duration: 1,
        clipPath: open ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
        autoAlpha: open ? 1 : 0,
        ease: "power4.inOut"
      });
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }
  };

  // js/Video.js
  var Video = class {
    constructor(element) {
      this.element = element;
      this.open = false;
      if (!this.element.dataset.video) {
        return;
      }
      this.elements();
      this.bind();
    }
    elements() {
      this.modal = document.querySelector(".video-modal");
      this.videoWrapper = this.modal.querySelector(".video-modal-video");
      this.closeButton = this.modal.querySelector(".video-modal-close");
      this.videoURL = this.element.dataset.video;
    }
    bind() {
      this.element.addEventListener("click", (e2) => {
        e2.preventDefault();
        if (this.open) {
          return;
        }
        this.openModal();
      });
      this.modal.addEventListener("click", () => {
        if (!this.open) {
          return;
        }
        this.closeModal();
      });
      this.videoWrapper.addEventListener("click", (e2) => {
        e2.stopPropagation();
      });
    }
    getYouTubeVideoId(url) {
      if (url.includes("youtu.be/")) {
        return url.split("youtu.be/")[1].split("?")[0];
      }
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? match[1] : url.split("v=")[1]?.split("&")[0];
    }
    openModal() {
      const embedUrl = this.videoURL.includes("vimeo.com") ? `https://player.vimeo.com/video/${this.videoURL.split("/").pop().split("?")[0]}?autoplay=1` : `https://www.youtube.com/embed/${this.getYouTubeVideoId(this.videoURL)}?autoplay=1`;
      this.videoWrapper.innerHTML = `<iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="pointer-events: auto; touch-action: auto;"></iframe>`;
      gsap.to(this.modal, {
        autoAlpha: 1,
        duration: 1,
        ease: "power4.inOut"
      });
      this.open = true;
    }
    closeModal() {
      gsap.to(this.modal, {
        autoAlpha: 0,
        duration: 1,
        ease: "power4.inOut",
        onComplete: () => {
          this.videoWrapper.innerHTML = "";
        }
      });
      this.open = false;
    }
  };

  // js/Parallax.js
  var Parallax = class {
    constructor(element) {
      this.element = element;
      this.elements();
      const initiate = () => {
        this.sizing();
        this.animate();
        g.scrollTrigger.refresh();
      };
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
    }
    sizing() {
      this.wrapperHeight = this.wrapper.offsetHeight;
      this.imageHeight = this.image.getBoundingClientRect().height;
      this.travelDistance = this.imageHeight - this.wrapperHeight;
    }
    animate() {
      gsap.set(this.image, {
        y: this.direction === "up" ? -this.travelDistance : 0
      });
      this.scrollTrigger = gsap.to(this.image, {
        y: this.direction === "up" ? 0 : -this.travelDistance,
        ease: "none",
        scrollTrigger: {
          trigger: this.wrapper,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    }
  };

  // js/Memberships.js
  var Memberships = class {
    constructor(element) {
      this.element = element;
      this.currentTab = null;
      this.elements();
      this.bind();
      if (window.location.hash) {
        const tabName = window.location.hash.substring(1);
        const index = this.togglerLinks.findIndex((link) => link.textContent.toLowerCase() === tabName);
        if (index !== -1) {
          this.showTab(index);
        }
      } else {
        this.showTab(0);
      }
      window.addEventListener("hashchange", () => {
        const tabName = window.location.hash.substring(1);
        const index = this.togglerLinks.findIndex((link) => link.textContent.toLowerCase() === tabName);
        if (index !== -1) {
          this.showTab(index);
        }
      });
    }
    elements() {
      this.togglerLinks = Array.from(this.element.querySelectorAll(".memberships-toggler div:not(.memberships-indicator)"));
      this.tabs = this.element.querySelectorAll(".memberships-tab");
      this.indicator = this.element.querySelector(".memberships-indicator");
      this.tabs.forEach((tab) => {
        tab.items = tab.querySelectorAll(".membership-plan");
        tab.items.forEach((item) => {
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
      const left = index > this.currentTab ? true : false;
      const bgcolors = ["#FFDF10", "#72BEE0"];
      const textcolors = ["#404040", "#FFFFFF", "#A9A9A9"];
      const currentTabName = this.togglerLinks[index].textContent.toLowerCase();
      window.location.hash = currentTabName;
      if (this.currentTab !== null) {
        const previousTab = this.tabs[this.currentTab];
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
        backgroundColor: bgcolors[index]
      }, 0.2);
      this.togglerLinks.forEach((item, i2) => {
        gsap.to(item, {
          color: i2 === index ? textcolors[index] : textcolors[2],
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
        xPercent: left ? -20 : 20
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
  };

  // js/SearchResults.js
  var SearchResults = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.create();
    }
    elements() {
      this.title = this.element.querySelector(".posts-search-title");
      this.posts = this.element.querySelectorAll(".posts-search-list");
    }
    create() {
      if (window.location.search.split("?query=")[1]) {
        const postSearchTerm = document.createElement("span");
        postSearchTerm.classList.add("post-search-term");
        postSearchTerm.innerHTML = window.location.search.split("?query=")[1];
        this.title.insertAdjacentElement("beforeend", postSearchTerm);
      }
      const postCount = document.createElement("span");
      postCount.classList.add("post-count");
      postCount.innerHTML = ` (${this.posts.length})`;
      this.title.insertAdjacentElement("beforeend", postCount);
    }
  };

  // js/ShrinkText.js
  var ShrinkText = class {
    constructor(element) {
      this.element = element;
      this.sizing();
    }
    sizing() {
      let newFontSize = 18 / 16;
      this.ticking = true;
      const resizeObserver = new ResizeObserver(() => {
        this.fitText();
      });
      resizeObserver.observe(this.element);
      this.fitText();
    }
    fitText() {
      const el = this.element;
      const containerHeight = el.clientHeight;
      const computedPx = parseFloat(getComputedStyle(el).fontSize);
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const startSize = computedPx / rootPx;
      if (el.scrollHeight <= containerHeight) return;
      let high = startSize;
      let low = 0.1;
      let best = low;
      while (low <= high) {
        const mid = (low + high) / 2;
        el.style.fontSize = `${mid}rem`;
        if (el.scrollHeight <= containerHeight) {
          best = mid;
          low = mid + 0.01;
        } else {
          high = mid - 0.01;
        }
      }
      el.style.fontSize = `${best}rem`;
    }
  };

  // js/Testimonials.js
  var Testimonials = class {
    constructor(element) {
      this.element = element;
      this.wrapper = this.element.querySelector(".testimonials-wrapper");
      this.elements();
      this.sizing();
      this.bind();
    }
    elements() {
      this.currentBreakpoint = null;
      this.currentPage = null;
      this.testimonials = this.element.querySelectorAll(".testimonial");
      this.next = this.element.querySelector(".testimonials-controls-next");
      this.prev = this.element.querySelector(".testimonials-controls-prev");
      this.indicators = this.element.querySelector(".testimonials-bullets");
      this.indicatorsBullets = this.indicators.querySelectorAll(".testimonials-bullet");
    }
    sizing() {
      this.breakpoint = window.innerWidth < 768 ? "mobile" : window.innerWidth < 992 ? "tablet" : "desktop";
      this.itemsPerPage = this.breakpoint === "mobile" ? 1 : this.breakpoint === "tablet" ? 2 : 3;
      this.totalPages = Math.ceil(this.testimonials.length / this.itemsPerPage);
      this.testimonialWidth = this.testimonials[0].getBoundingClientRect().width;
      this.testimonialGap = parseInt(getComputedStyle(this.wrapper).columnGap);
      const changePagesCount = () => {
        this.indicators.innerHTML = "";
        for (let i2 = 0; i2 < this.totalPages; i2++) {
          const indicator = document.createElement("div");
          indicator.classList.add("testimonials-bullet");
          this.indicators.appendChild(indicator);
        }
        this.indicatorsBullets = this.indicators.querySelectorAll(".testimonials-bullet");
        this.indicatorsBullets[0].classList.add("active", "from-left");
        this.indicatorsBullets.forEach((bullet, index) => {
          bullet.addEventListener("click", (e2) => {
            this.update(index);
          });
        });
      };
      if (this.breakpoint !== this.currentBreakpoint) {
        this.currentBreakpoint = this.breakpoint;
        changePagesCount();
        this.update(0);
      }
    }
    create() {
      const testimonialOriginal = this.element.querySelector(".testimonial");
      for (let i2 = 0; i2 < 8; i2++) {
        const testimonial = testimonialOriginal.cloneNode(true);
        this.wrapper.appendChild(testimonial);
      }
    }
    bind() {
      this.next.addEventListener("click", () => {
        if (this.currentPage === this.totalPages - 1) {
          return;
        }
        this.update(Math.min(this.totalPages - 1, this.currentPage + 1));
      });
      this.prev.addEventListener("click", () => {
        if (this.currentPage === 0) {
          return;
        }
        this.update(Math.max(0, this.currentPage - 1));
      });
      window.addEventListener("resize", () => {
        this.sizing();
      });
    }
    update(newPage) {
      let page = Math.min(this.testimonials.length - this.itemsPerPage, newPage * this.itemsPerPage);
      this.indicatorsBullets[newPage].classList.add("active", newPage > this.currentPage ? "from-left" : "from-right");
      if (this.currentPage !== null) {
        this.indicatorsBullets[this.currentPage].classList.remove("active", "from-left", "from-right");
      }
      gsap.to(this.testimonials, {
        x: page * (this.testimonialWidth + this.testimonialGap) * -1,
        ease: "elastic.out(1, 0.9)",
        duration: 2
      });
      this.currentPage = newPage;
    }
  };

  // js/FaqElements.js
  var FaqElements = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.bind();
    }
    elements() {
      this.items = this.element.querySelectorAll(".faq-item");
      this.items.forEach((item) => {
        this.answer = item.querySelector(".faq-item-a");
      });
    }
    bind() {
      this.items.forEach((item) => {
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
          ease: "circ.out"
        });
        item.classList.add("active");
      } else {
        gsap.to(answer, {
          height: 0,
          duration: 1,
          ease: "circ.out"
        });
        item.classList.remove("active");
      }
      item.open = !item.open;
    }
  };

  // js/Stagger.js
  var Stagger = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.animate();
    }
    elements() {
      this.directChildren = Array.from(this.element.children).filter(
        (child) => !child.classList.contains("stagger") && !child.classList.contains("stagger-left") && !child.classList.contains("stagger-right")
      );
      const staggerLeftChildren = this.element.querySelectorAll(".stagger-left > *");
      const staggerRightChildren = this.element.querySelectorAll(".stagger-right > *");
      const staggerChildren = this.element.querySelectorAll(".stagger > *");
      if (staggerLeftChildren.length > 0) {
        this.staggerType = "left";
        this.indirectChildren = staggerLeftChildren;
      } else if (staggerRightChildren.length > 0) {
        this.staggerType = "right";
        this.indirectChildren = staggerRightChildren;
      } else {
        this.staggerType = "normal";
        this.indirectChildren = staggerChildren;
      }
      this.allChildren = [...this.directChildren, ...this.indirectChildren];
    }
    animate() {
      if (this.directChildren.length > 0) {
        gsap.set(this.directChildren, {
          opacity: 0,
          y: "2rem"
        });
        gsap.utils.toArray(this.directChildren).forEach((child) => {
          gsap.to(child, {
            opacity: 1,
            y: 0,
            duration: 2,
            delay: 0.2,
            ease: "elastic.out(1, 0.7)",
            scrollTrigger: {
              trigger: child,
              start: "top bottom",
              toggleActions: "play none none reset"
            }
          });
        });
      }
      if (this.indirectChildren.length > 0) {
        gsap.set(this.indirectChildren, {
          opacity: 0,
          y: 30
        });
        gsap.to(this.indirectChildren, {
          opacity: 1,
          y: 0,
          duration: 2,
          delay: 0.2,
          ease: "elastic.out(1, 0.7)",
          scrollTrigger: {
            trigger: this.indirectChildren[0],
            start: "top bottom",
            end: "bottom top",
            toggleActions: "play none none reset"
          },
          stagger: {
            amount: 0.5
          }
        });
      }
    }
  };

  // js/HeadingWave.js
  var HeadingWave = class {
    constructor(element) {
      this.element = element;
      this.elements();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this.animateLow();
        });
      } else {
        this.animateLow();
      }
    }
    elements() {
      this.heading = this.element.querySelector(".heading");
      this.headingUnits = this.heading.querySelectorAll(".heading-unit");
      this.hasColor = getComputedStyle(this.heading).getPropertyValue("--color1") !== "" && getComputedStyle(this.heading).getPropertyValue("--color2") !== "";
      this.image = this.element.querySelector("img");
      this.text = this.element.querySelector(".media-content");
      this.slot = this.element.querySelector(".media-slot");
    }
    split() {
      this.splitText = new g.splitText(this.headingUnits, {
        type: this.hasColor ? "words, chars, lines" : "words, chars",
        linesClass: "line",
        charsClass: "char",
        smartWrap: true
      });
      this.hasColor && this.splitText.lines.forEach((line) => {
        splitTextGradient(line, line.querySelectorAll(".char"));
      });
    }
    animate() {
      this.splitText.chars && gsap.set(this.splitText.chars, {
        opacity: 0,
        scaleY: 0,
        transformOrigin: "center bottom"
      });
      this.image && gsap.set(this.image, {
        opacity: 0,
        y: "2rem"
      });
      this.text && gsap.set(this.text, {
        opacity: 0,
        y: "2rem"
      });
      this.slot && gsap.set(this.slot, {
        opacity: 0,
        y: "2rem"
      });
      this.image && gsap.to(this.image, {
        opacity: 1,
        duration: 1,
        y: 0,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.image,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
      this.text && gsap.to(this.text, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.text,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
      this.slot && gsap.to(this.slot, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.slot,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
      this.splitText.chars && gsap.to(this.splitText.chars, {
        opacity: 1,
        scaleY: 1,
        ease: "elastic.out(1, 0.7)",
        stagger: {
          amount: 1
        },
        scrollTrigger: {
          trigger: this.splitText.chars,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
    }
    animateLow() {
      gsap.set(this.element, {
        opacity: 0,
        y: 30
      });
      gsap.to(this.element, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: this.element,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
    }
  };

  // js/Image.js
  var Image = class {
    constructor(element) {
      this.element = element;
      return;
      this.elements();
      this.animate();
    }
    elements() {
      this.image = this.element.querySelector("img");
    }
    animate() {
      gsap.set(this.element, {
        clipPath: "inset(100% 0% 0% 0%)"
      });
      gsap.set(this.image, {
        scale: 0.8
      });
      gsap.to(this.element, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.element,
          start: "top bottom",
          end: "top top",
          scrub: true
        }
      });
      gsap.to(this.image, {
        scale: 1,
        duration: 1,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.element,
          start: "top bottom",
          end: "top top",
          scrub: true
        }
      });
    }
  };

  // js/Balls.js
  var Balls = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.animateLow();
    }
    elements() {
      this.balls = this.element.querySelectorAll("[data-target='ball']");
    }
    animate() {
      gsap.set(this.balls, {
        xPercent: -100,
        autoAlpha: 0,
        rotate: -180
      });
      gsap.to(this.balls, {
        xPercent: 0,
        rotate: 0,
        autoAlpha: 1,
        duration: 2,
        ease: "elastic.out(1, 0.7)",
        stagger: {
          each: 0.3
        },
        scrollTrigger: {
          trigger: this.element,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
    }
    animateLow() {
      gsap.set(this.balls, {
        y: 30,
        autoAlpha: 0
      });
      gsap.to(this.balls, {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        ease: "power4.out",
        delay: 0.2,
        scrollTrigger: {
          trigger: this.element,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
    }
  };

  // node_modules/rough-notation/lib/rough-notation.esm.js
  var t = "http://www.w3.org/2000/svg";
  var e = class {
    constructor(t2) {
      this.seed = t2;
    }
    next() {
      return this.seed ? (2 ** 31 - 1 & (this.seed = Math.imul(48271, this.seed))) / 2 ** 31 : Math.random();
    }
  };
  function s(t2, e2, s2, i2, n2) {
    return { type: "path", ops: c(t2, e2, s2, i2, n2) };
  }
  function i(t2, e2, i2) {
    const n2 = (t2 || []).length;
    if (n2 > 2) {
      const s2 = [];
      for (let e3 = 0; e3 < n2 - 1; e3++) s2.push(...c(t2[e3][0], t2[e3][1], t2[e3 + 1][0], t2[e3 + 1][1], i2));
      return e2 && s2.push(...c(t2[n2 - 1][0], t2[n2 - 1][1], t2[0][0], t2[0][1], i2)), { type: "path", ops: s2 };
    }
    return 2 === n2 ? s(t2[0][0], t2[0][1], t2[1][0], t2[1][1], i2) : { type: "path", ops: [] };
  }
  function n(t2, e2, s2, n2, o2) {
    return function(t3, e3) {
      return i(t3, true, e3);
    }([[t2, e2], [t2 + s2, e2], [t2 + s2, e2 + n2], [t2, e2 + n2]], o2);
  }
  function o(t2, e2, s2, i2, n2) {
    return function(t3, e3, s3, i3) {
      const [n3, o2] = l(i3.increment, t3, e3, i3.rx, i3.ry, 1, i3.increment * h(0.1, h(0.4, 1, s3), s3), s3);
      let r2 = f(n3, null, s3);
      if (!s3.disableMultiStroke) {
        const [n4] = l(i3.increment, t3, e3, i3.rx, i3.ry, 1.5, 0, s3), o3 = f(n4, null, s3);
        r2 = r2.concat(o3);
      }
      return { estimatedPoints: o2, opset: { type: "path", ops: r2 } };
    }(t2, e2, n2, function(t3, e3, s3) {
      const i3 = Math.sqrt(2 * Math.PI * Math.sqrt((Math.pow(t3 / 2, 2) + Math.pow(e3 / 2, 2)) / 2)), n3 = Math.max(s3.curveStepCount, s3.curveStepCount / Math.sqrt(200) * i3), o2 = 2 * Math.PI / n3;
      let r2 = Math.abs(t3 / 2), h2 = Math.abs(e3 / 2);
      const c2 = 1 - s3.curveFitting;
      return r2 += a(r2 * c2, s3), h2 += a(h2 * c2, s3), { increment: o2, rx: r2, ry: h2 };
    }(s2, i2, n2)).opset;
  }
  function r(t2) {
    return t2.randomizer || (t2.randomizer = new e(t2.seed || 0)), t2.randomizer.next();
  }
  function h(t2, e2, s2, i2 = 1) {
    return s2.roughness * i2 * (r(s2) * (e2 - t2) + t2);
  }
  function a(t2, e2, s2 = 1) {
    return h(-t2, t2, e2, s2);
  }
  function c(t2, e2, s2, i2, n2, o2 = false) {
    const r2 = o2 ? n2.disableMultiStrokeFill : n2.disableMultiStroke, h2 = u(t2, e2, s2, i2, n2, true, false);
    if (r2) return h2;
    const a2 = u(t2, e2, s2, i2, n2, true, true);
    return h2.concat(a2);
  }
  function u(t2, e2, s2, i2, n2, o2, h2) {
    const c2 = Math.pow(t2 - s2, 2) + Math.pow(e2 - i2, 2), u2 = Math.sqrt(c2);
    let f2 = 1;
    f2 = u2 < 200 ? 1 : u2 > 500 ? 0.4 : -16668e-7 * u2 + 1.233334;
    let l2 = n2.maxRandomnessOffset || 0;
    l2 * l2 * 100 > c2 && (l2 = u2 / 10);
    const g3 = l2 / 2, d2 = 0.2 + 0.2 * r(n2);
    let p2 = n2.bowing * n2.maxRandomnessOffset * (i2 - e2) / 200, _2 = n2.bowing * n2.maxRandomnessOffset * (t2 - s2) / 200;
    p2 = a(p2, n2, f2), _2 = a(_2, n2, f2);
    const m = [], w = () => a(g3, n2, f2), v = () => a(l2, n2, f2);
    return o2 && (h2 ? m.push({ op: "move", data: [t2 + w(), e2 + w()] }) : m.push({ op: "move", data: [t2 + a(l2, n2, f2), e2 + a(l2, n2, f2)] })), h2 ? m.push({ op: "bcurveTo", data: [p2 + t2 + (s2 - t2) * d2 + w(), _2 + e2 + (i2 - e2) * d2 + w(), p2 + t2 + 2 * (s2 - t2) * d2 + w(), _2 + e2 + 2 * (i2 - e2) * d2 + w(), s2 + w(), i2 + w()] }) : m.push({ op: "bcurveTo", data: [p2 + t2 + (s2 - t2) * d2 + v(), _2 + e2 + (i2 - e2) * d2 + v(), p2 + t2 + 2 * (s2 - t2) * d2 + v(), _2 + e2 + 2 * (i2 - e2) * d2 + v(), s2 + v(), i2 + v()] }), m;
  }
  function f(t2, e2, s2) {
    const i2 = t2.length, n2 = [];
    if (i2 > 3) {
      const o2 = [], r2 = 1 - s2.curveTightness;
      n2.push({ op: "move", data: [t2[1][0], t2[1][1]] });
      for (let e3 = 1; e3 + 2 < i2; e3++) {
        const s3 = t2[e3];
        o2[0] = [s3[0], s3[1]], o2[1] = [s3[0] + (r2 * t2[e3 + 1][0] - r2 * t2[e3 - 1][0]) / 6, s3[1] + (r2 * t2[e3 + 1][1] - r2 * t2[e3 - 1][1]) / 6], o2[2] = [t2[e3 + 1][0] + (r2 * t2[e3][0] - r2 * t2[e3 + 2][0]) / 6, t2[e3 + 1][1] + (r2 * t2[e3][1] - r2 * t2[e3 + 2][1]) / 6], o2[3] = [t2[e3 + 1][0], t2[e3 + 1][1]], n2.push({ op: "bcurveTo", data: [o2[1][0], o2[1][1], o2[2][0], o2[2][1], o2[3][0], o2[3][1]] });
      }
      if (e2 && 2 === e2.length) {
        const t3 = s2.maxRandomnessOffset;
        n2.push({ op: "lineTo", data: [e2[0] + a(t3, s2), e2[1] + a(t3, s2)] });
      }
    } else 3 === i2 ? (n2.push({ op: "move", data: [t2[1][0], t2[1][1]] }), n2.push({ op: "bcurveTo", data: [t2[1][0], t2[1][1], t2[2][0], t2[2][1], t2[2][0], t2[2][1]] })) : 2 === i2 && n2.push(...c(t2[0][0], t2[0][1], t2[1][0], t2[1][1], s2));
    return n2;
  }
  function l(t2, e2, s2, i2, n2, o2, r2, h2) {
    const c2 = [], u2 = [], f2 = a(0.5, h2) - Math.PI / 2;
    u2.push([a(o2, h2) + e2 + 0.9 * i2 * Math.cos(f2 - t2), a(o2, h2) + s2 + 0.9 * n2 * Math.sin(f2 - t2)]);
    for (let r3 = f2; r3 < 2 * Math.PI + f2 - 0.01; r3 += t2) {
      const t3 = [a(o2, h2) + e2 + i2 * Math.cos(r3), a(o2, h2) + s2 + n2 * Math.sin(r3)];
      c2.push(t3), u2.push(t3);
    }
    return u2.push([a(o2, h2) + e2 + i2 * Math.cos(f2 + 2 * Math.PI + 0.5 * r2), a(o2, h2) + s2 + n2 * Math.sin(f2 + 2 * Math.PI + 0.5 * r2)]), u2.push([a(o2, h2) + e2 + 0.98 * i2 * Math.cos(f2 + r2), a(o2, h2) + s2 + 0.98 * n2 * Math.sin(f2 + r2)]), u2.push([a(o2, h2) + e2 + 0.9 * i2 * Math.cos(f2 + 0.5 * r2), a(o2, h2) + s2 + 0.9 * n2 * Math.sin(f2 + 0.5 * r2)]), [u2, c2];
  }
  function g2(t2, e2) {
    return { maxRandomnessOffset: 2, roughness: "highlight" === t2 ? 3 : 1.5, bowing: 1, stroke: "#000", strokeWidth: 1.5, curveTightness: 0, curveFitting: 0.95, curveStepCount: 9, fillStyle: "hachure", fillWeight: -1, hachureAngle: -41, hachureGap: -1, dashOffset: -1, dashGap: -1, zigzagOffset: -1, combineNestedSvgPaths: false, disableMultiStroke: "double" !== t2, disableMultiStrokeFill: false, seed: e2 };
  }
  function d(e2, r2, h2, a2, c2, u2) {
    const f2 = [];
    let l2 = h2.strokeWidth || 2;
    const d2 = function(t2) {
      const e3 = t2.padding;
      if (e3 || 0 === e3) {
        if ("number" == typeof e3) return [e3, e3, e3, e3];
        if (Array.isArray(e3)) {
          const t3 = e3;
          if (t3.length) switch (t3.length) {
            case 4:
              return [...t3];
            case 1:
              return [t3[0], t3[0], t3[0], t3[0]];
            case 2:
              return [...t3, ...t3];
            case 3:
              return [...t3, t3[1]];
            default:
              return [t3[0], t3[1], t3[2], t3[3]];
          }
        }
      }
      return [5, 5, 5, 5];
    }(h2), p2 = void 0 === h2.animate || !!h2.animate, _2 = h2.iterations || 2, m = h2.rtl ? 1 : 0, w = g2("single", u2);
    switch (h2.type) {
      case "underline": {
        const t2 = r2.y + r2.h + d2[2];
        for (let e3 = m; e3 < _2 + m; e3++) e3 % 2 ? f2.push(s(r2.x + r2.w, t2, r2.x, t2, w)) : f2.push(s(r2.x, t2, r2.x + r2.w, t2, w));
        break;
      }
      case "strike-through": {
        const t2 = r2.y + r2.h / 2;
        for (let e3 = m; e3 < _2 + m; e3++) e3 % 2 ? f2.push(s(r2.x + r2.w, t2, r2.x, t2, w)) : f2.push(s(r2.x, t2, r2.x + r2.w, t2, w));
        break;
      }
      case "box": {
        const t2 = r2.x - d2[3], e3 = r2.y - d2[0], s2 = r2.w + (d2[1] + d2[3]), i2 = r2.h + (d2[0] + d2[2]);
        for (let o2 = 0; o2 < _2; o2++) f2.push(n(t2, e3, s2, i2, w));
        break;
      }
      case "bracket": {
        const t2 = Array.isArray(h2.brackets) ? h2.brackets : h2.brackets ? [h2.brackets] : ["right"], e3 = r2.x - 2 * d2[3], s2 = r2.x + r2.w + 2 * d2[1], n2 = r2.y - 2 * d2[0], o2 = r2.y + r2.h + 2 * d2[2];
        for (const h3 of t2) {
          let t3;
          switch (h3) {
            case "bottom":
              t3 = [[e3, r2.y + r2.h], [e3, o2], [s2, o2], [s2, r2.y + r2.h]];
              break;
            case "top":
              t3 = [[e3, r2.y], [e3, n2], [s2, n2], [s2, r2.y]];
              break;
            case "left":
              t3 = [[r2.x, n2], [e3, n2], [e3, o2], [r2.x, o2]];
              break;
            case "right":
              t3 = [[r2.x + r2.w, n2], [s2, n2], [s2, o2], [r2.x + r2.w, o2]];
          }
          t3 && f2.push(i(t3, false, w));
        }
        break;
      }
      case "crossed-off": {
        const t2 = r2.x, e3 = r2.y, i2 = t2 + r2.w, n2 = e3 + r2.h;
        for (let o2 = m; o2 < _2 + m; o2++) o2 % 2 ? f2.push(s(i2, n2, t2, e3, w)) : f2.push(s(t2, e3, i2, n2, w));
        for (let o2 = m; o2 < _2 + m; o2++) o2 % 2 ? f2.push(s(t2, n2, i2, e3, w)) : f2.push(s(i2, e3, t2, n2, w));
        break;
      }
      case "circle": {
        const t2 = g2("double", u2), e3 = r2.w + (d2[1] + d2[3]), s2 = r2.h + (d2[0] + d2[2]), i2 = r2.x - d2[3] + e3 / 2, n2 = r2.y - d2[0] + s2 / 2, h3 = Math.floor(_2 / 2), a3 = _2 - 2 * h3;
        for (let r3 = 0; r3 < h3; r3++) f2.push(o(i2, n2, e3, s2, t2));
        for (let t3 = 0; t3 < a3; t3++) f2.push(o(i2, n2, e3, s2, w));
        break;
      }
      case "highlight": {
        const t2 = g2("highlight", u2);
        l2 = 0.95 * r2.h;
        const e3 = r2.y + r2.h / 2;
        for (let i2 = m; i2 < _2 + m; i2++) i2 % 2 ? f2.push(s(r2.x + r2.w, e3, r2.x, e3, t2)) : f2.push(s(r2.x, e3, r2.x + r2.w, e3, t2));
        break;
      }
    }
    if (f2.length) {
      const s2 = function(t2) {
        const e3 = [];
        for (const s3 of t2) {
          let t3 = "";
          for (const i3 of s3.ops) {
            const s4 = i3.data;
            switch (i3.op) {
              case "move":
                t3.trim() && e3.push(t3.trim()), t3 = `M${s4[0]} ${s4[1]} `;
                break;
              case "bcurveTo":
                t3 += `C${s4[0]} ${s4[1]}, ${s4[2]} ${s4[3]}, ${s4[4]} ${s4[5]} `;
                break;
              case "lineTo":
                t3 += `L${s4[0]} ${s4[1]} `;
            }
          }
          t3.trim() && e3.push(t3.trim());
        }
        return e3;
      }(f2), i2 = [], n2 = [];
      let o2 = 0;
      const r3 = (t2, e3, s3) => t2.setAttribute(e3, s3);
      for (const a3 of s2) {
        const s3 = document.createElementNS(t, "path");
        if (r3(s3, "d", a3), r3(s3, "fill", "none"), r3(s3, "stroke", h2.color || "currentColor"), r3(s3, "stroke-width", "" + l2), p2) {
          const t2 = s3.getTotalLength();
          i2.push(t2), o2 += t2;
        }
        e2.appendChild(s3), n2.push(s3);
      }
      if (p2) {
        let t2 = 0;
        for (let e3 = 0; e3 < n2.length; e3++) {
          const s3 = n2[e3], r4 = i2[e3], h3 = o2 ? c2 * (r4 / o2) : 0, u3 = a2 + t2, f3 = s3.style;
          f3.strokeDashoffset = "" + r4, f3.strokeDasharray = "" + r4, f3.animation = `rough-notation-dash ${h3}ms ease-out ${u3}ms forwards`, t2 += h3;
        }
      }
    }
  }
  var p = class {
    constructor(t2, e2) {
      this._state = "unattached", this._resizing = false, this._seed = Math.floor(Math.random() * 2 ** 31), this._lastSizes = [], this._animationDelay = 0, this._resizeListener = () => {
        this._resizing || (this._resizing = true, setTimeout(() => {
          this._resizing = false, "showing" === this._state && this.haveRectsChanged() && this.show();
        }, 400));
      }, this._e = t2, this._config = JSON.parse(JSON.stringify(e2)), this.attach();
    }
    get animate() {
      return this._config.animate;
    }
    set animate(t2) {
      this._config.animate = t2;
    }
    get animationDuration() {
      return this._config.animationDuration;
    }
    set animationDuration(t2) {
      this._config.animationDuration = t2;
    }
    get iterations() {
      return this._config.iterations;
    }
    set iterations(t2) {
      this._config.iterations = t2;
    }
    get color() {
      return this._config.color;
    }
    set color(t2) {
      this._config.color !== t2 && (this._config.color = t2, this.refresh());
    }
    get strokeWidth() {
      return this._config.strokeWidth;
    }
    set strokeWidth(t2) {
      this._config.strokeWidth !== t2 && (this._config.strokeWidth = t2, this.refresh());
    }
    get padding() {
      return this._config.padding;
    }
    set padding(t2) {
      this._config.padding !== t2 && (this._config.padding = t2, this.refresh());
    }
    attach() {
      if ("unattached" === this._state && this._e.parentElement) {
        !function() {
          if (!window.__rno_kf_s) {
            const t2 = window.__rno_kf_s = document.createElement("style");
            t2.textContent = "@keyframes rough-notation-dash { to { stroke-dashoffset: 0; } }", document.head.appendChild(t2);
          }
        }();
        const e2 = this._svg = document.createElementNS(t, "svg");
        e2.setAttribute("class", "rough-annotation");
        const s2 = e2.style;
        s2.position = "absolute", s2.top = "0", s2.left = "0", s2.overflow = "visible", s2.pointerEvents = "none", s2.width = "100px", s2.height = "100px";
        const i2 = "highlight" === this._config.type;
        if (this._e.insertAdjacentElement(i2 ? "beforebegin" : "afterend", e2), this._state = "not-showing", i2) {
          const t2 = window.getComputedStyle(this._e).position;
          (!t2 || "static" === t2) && (this._e.style.position = "relative");
        }
        this.attachListeners();
      }
    }
    detachListeners() {
      window.removeEventListener("resize", this._resizeListener), this._ro && this._ro.unobserve(this._e);
    }
    attachListeners() {
      this.detachListeners(), window.addEventListener("resize", this._resizeListener, { passive: true }), !this._ro && "ResizeObserver" in window && (this._ro = new window.ResizeObserver((t2) => {
        for (const e2 of t2) e2.contentRect && this._resizeListener();
      })), this._ro && this._ro.observe(this._e);
    }
    haveRectsChanged() {
      if (this._lastSizes.length) {
        const t2 = this.rects();
        if (t2.length !== this._lastSizes.length) return true;
        for (let e2 = 0; e2 < t2.length; e2++) if (!this.isSameRect(t2[e2], this._lastSizes[e2])) return true;
      }
      return false;
    }
    isSameRect(t2, e2) {
      const s2 = (t3, e3) => Math.round(t3) === Math.round(e3);
      return s2(t2.x, e2.x) && s2(t2.y, e2.y) && s2(t2.w, e2.w) && s2(t2.h, e2.h);
    }
    isShowing() {
      return "not-showing" !== this._state;
    }
    refresh() {
      this.isShowing() && !this.pendingRefresh && (this.pendingRefresh = Promise.resolve().then(() => {
        this.isShowing() && this.show(), delete this.pendingRefresh;
      }));
    }
    show() {
      switch (this._state) {
        case "unattached":
          break;
        case "showing":
          this.hide(), this._svg && this.render(this._svg, true);
          break;
        case "not-showing":
          this.attach(), this._svg && this.render(this._svg, false);
      }
    }
    hide() {
      if (this._svg) for (; this._svg.lastChild; ) this._svg.removeChild(this._svg.lastChild);
      this._state = "not-showing";
    }
    remove() {
      this._svg && this._svg.parentElement && this._svg.parentElement.removeChild(this._svg), this._svg = void 0, this._state = "unattached", this.detachListeners();
    }
    render(t2, e2) {
      let s2 = this._config;
      e2 && (s2 = JSON.parse(JSON.stringify(this._config)), s2.animate = false);
      const i2 = this.rects();
      let n2 = 0;
      i2.forEach((t3) => n2 += t3.w);
      const o2 = s2.animationDuration || 800;
      let r2 = 0;
      for (let e3 = 0; e3 < i2.length; e3++) {
        const h2 = o2 * (i2[e3].w / n2);
        d(t2, i2[e3], s2, r2 + this._animationDelay, h2, this._seed), r2 += h2;
      }
      this._lastSizes = i2, this._state = "showing";
    }
    rects() {
      const t2 = [];
      if (this._svg) if (this._config.multiline) {
        const e2 = this._e.getClientRects();
        for (let s2 = 0; s2 < e2.length; s2++) t2.push(this.svgRect(this._svg, e2[s2]));
      } else t2.push(this.svgRect(this._svg, this._e.getBoundingClientRect()));
      return t2;
    }
    svgRect(t2, e2) {
      const s2 = t2.getBoundingClientRect(), i2 = e2;
      return { x: (i2.x || i2.left) - (s2.x || s2.left), y: (i2.y || i2.top) - (s2.y || s2.top), w: i2.width, h: i2.height };
    }
  };
  function _(t2, e2) {
    return new p(t2, e2);
  }

  // js/Annotations.js
  var Annotations = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.init();
    }
    elements() {
    }
    init() {
      const annotationType = this.element.dataset.annotation;
      const annotationColor = this.element.dataset.annotation_color ? this.element.dataset.annotation_color : "#2C2B32";
      const annotationThickness = this.element.dataset.annotation_thickness ? parseFloat(this.element.dataset.annotation_thickness) : 1;
      const annotationPadding = this.element.dataset.annotation_padding ? parseFloat(this.element.dataset.annotation_padding) : 5;
      const bracketsDirections = this.element.dataset.brackets_directions ? this.element.dataset.brackets_directions.split(",").map((item) => item.trim()) : ["top"];
      this.repeat = this.element.dataset.annotation_repeat === "" ? true : false;
      this.element.style.zIndex = 1;
      let annotationConfig = {
        color: annotationColor,
        strokeWidth: annotationThickness,
        iterations: 5,
        padding: annotationPadding
      };
      switch (annotationType) {
        case "underline":
          this.annotation = _(this.element, { ...annotationConfig, type: "underline" });
          break;
        case "circle":
          this.annotation = _(this.element, { ...annotationConfig, type: "circle" });
          break;
        case "box":
          this.annotation = _(this.element, { ...annotationConfig, type: "box" });
          break;
        case "highlight":
          this.annotation = _(this.element, { ...annotationConfig, type: "highlight" });
          break;
        case "bracket":
          this.annotation = _(this.element, { ...annotationConfig, type: "bracket", brackets: bracketsDirections });
          break;
        case "strikethrough":
          this.annotation = _(this.element, { ...annotationConfig, type: "strike-through" });
          break;
        case "crossed-off":
          this.annotation = _(this.element, { ...annotationConfig, type: "crossed-off" });
          break;
      }
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          entry.target._annotationInstance.annotation.show();
          if (entry.isIntersecting) {
            if (!entry.target._annotationInstance.repeat) {
              this.observer.unobserve(entry.target);
            }
          } else {
            if (entry.target._annotationInstance.repeat) {
              entry.target._annotationInstance.annotation.hide();
            }
          }
        });
      }, {
        threshold: 0.3
      });
      this.element._annotationInstance = this;
      this.observer.observe(this.element);
    }
  };

  // node_modules/gsap/Observer.js
  function _defineProperties(target, props) {
    for (var i2 = 0; i2 < props.length; i2++) {
      var descriptor = props[i2];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  var gsap2;
  var _coreInitted;
  var _clamp;
  var _win;
  var _doc;
  var _docEl;
  var _body;
  var _isTouch;
  var _pointerType;
  var ScrollTrigger;
  var _root;
  var _normalizer;
  var _eventTypes;
  var _context;
  var _getGSAP = function _getGSAP2() {
    return gsap2 || typeof window !== "undefined" && (gsap2 = window.gsap) && gsap2.registerPlugin && gsap2;
  };
  var _startup = 1;
  var _observers = [];
  var _scrollers = [];
  var _proxies = [];
  var _getTime = Date.now;
  var _bridge = function _bridge2(name, value) {
    return value;
  };
  var _integrate = function _integrate2() {
    var core = ScrollTrigger.core, data = core.bridge || {}, scrollers = core._scrollers, proxies = core._proxies;
    scrollers.push.apply(scrollers, _scrollers);
    proxies.push.apply(proxies, _proxies);
    _scrollers = scrollers;
    _proxies = proxies;
    _bridge = function _bridge3(name, value) {
      return data[name](value);
    };
  };
  var _getProxyProp = function _getProxyProp2(element, property) {
    return ~_proxies.indexOf(element) && _proxies[_proxies.indexOf(element) + 1][property];
  };
  var _isViewport = function _isViewport2(el) {
    return !!~_root.indexOf(el);
  };
  var _addListener = function _addListener2(element, type, func, passive, capture) {
    return element.addEventListener(type, func, {
      passive: passive !== false,
      capture: !!capture
    });
  };
  var _removeListener = function _removeListener2(element, type, func, capture) {
    return element.removeEventListener(type, func, !!capture);
  };
  var _scrollLeft = "scrollLeft";
  var _scrollTop = "scrollTop";
  var _onScroll = function _onScroll2() {
    return _normalizer && _normalizer.isPressed || _scrollers.cache++;
  };
  var _scrollCacheFunc = function _scrollCacheFunc2(f2, doNotCache) {
    var cachingFunc = function cachingFunc2(value) {
      if (value || value === 0) {
        _startup && (_win.history.scrollRestoration = "manual");
        var isNormalizing = _normalizer && _normalizer.isPressed;
        value = cachingFunc2.v = Math.round(value) || (_normalizer && _normalizer.iOS ? 1 : 0);
        f2(value);
        cachingFunc2.cacheID = _scrollers.cache;
        isNormalizing && _bridge("ss", value);
      } else if (doNotCache || _scrollers.cache !== cachingFunc2.cacheID || _bridge("ref")) {
        cachingFunc2.cacheID = _scrollers.cache;
        cachingFunc2.v = f2();
      }
      return cachingFunc2.v + cachingFunc2.offset;
    };
    cachingFunc.offset = 0;
    return f2 && cachingFunc;
  };
  var _horizontal = {
    s: _scrollLeft,
    p: "left",
    p2: "Left",
    os: "right",
    os2: "Right",
    d: "width",
    d2: "Width",
    a: "x",
    sc: _scrollCacheFunc(function(value) {
      return arguments.length ? _win.scrollTo(value, _vertical.sc()) : _win.pageXOffset || _doc[_scrollLeft] || _docEl[_scrollLeft] || _body[_scrollLeft] || 0;
    })
  };
  var _vertical = {
    s: _scrollTop,
    p: "top",
    p2: "Top",
    os: "bottom",
    os2: "Bottom",
    d: "height",
    d2: "Height",
    a: "y",
    op: _horizontal,
    sc: _scrollCacheFunc(function(value) {
      return arguments.length ? _win.scrollTo(_horizontal.sc(), value) : _win.pageYOffset || _doc[_scrollTop] || _docEl[_scrollTop] || _body[_scrollTop] || 0;
    })
  };
  var _getTarget = function _getTarget2(t2, self) {
    return (self && self._ctx && self._ctx.selector || gsap2.utils.toArray)(t2)[0] || (typeof t2 === "string" && gsap2.config().nullTargetWarn !== false ? console.warn("Element not found:", t2) : null);
  };
  var _isWithin = function _isWithin2(element, list) {
    var i2 = list.length;
    while (i2--) {
      if (list[i2] === element || list[i2].contains(element)) {
        return true;
      }
    }
    return false;
  };
  var _getScrollFunc = function _getScrollFunc2(element, _ref) {
    var s2 = _ref.s, sc = _ref.sc;
    _isViewport(element) && (element = _doc.scrollingElement || _docEl);
    var i2 = _scrollers.indexOf(element), offset = sc === _vertical.sc ? 1 : 2;
    !~i2 && (i2 = _scrollers.push(element) - 1);
    _scrollers[i2 + offset] || _addListener(element, "scroll", _onScroll);
    var prev = _scrollers[i2 + offset], func = prev || (_scrollers[i2 + offset] = _scrollCacheFunc(_getProxyProp(element, s2), true) || (_isViewport(element) ? sc : _scrollCacheFunc(function(value) {
      return arguments.length ? element[s2] = value : element[s2];
    })));
    func.target = element;
    prev || (func.smooth = gsap2.getProperty(element, "scrollBehavior") === "smooth");
    return func;
  };
  var _getVelocityProp = function _getVelocityProp2(value, minTimeRefresh, useDelta) {
    var v1 = value, v2 = value, t1 = _getTime(), t2 = t1, min = minTimeRefresh || 50, dropToZeroTime = Math.max(500, min * 3), update = function update2(value2, force) {
      var t3 = _getTime();
      if (force || t3 - t1 > min) {
        v2 = v1;
        v1 = value2;
        t2 = t1;
        t1 = t3;
      } else if (useDelta) {
        v1 += value2;
      } else {
        v1 = v2 + (value2 - v2) / (t3 - t2) * (t1 - t2);
      }
    }, reset = function reset2() {
      v2 = v1 = useDelta ? 0 : v1;
      t2 = t1 = 0;
    }, getVelocity = function getVelocity2(latestValue) {
      var tOld = t2, vOld = v2, t3 = _getTime();
      (latestValue || latestValue === 0) && latestValue !== v1 && update(latestValue);
      return t1 === t2 || t3 - t2 > dropToZeroTime ? 0 : (v1 + (useDelta ? vOld : -vOld)) / ((useDelta ? t3 : t1) - tOld) * 1e3;
    };
    return {
      update,
      reset,
      getVelocity
    };
  };
  var _getEvent = function _getEvent2(e2, preventDefault) {
    preventDefault && !e2._gsapAllow && e2.preventDefault();
    return e2.changedTouches ? e2.changedTouches[0] : e2;
  };
  var _getAbsoluteMax = function _getAbsoluteMax2(a2) {
    var max = Math.max.apply(Math, a2), min = Math.min.apply(Math, a2);
    return Math.abs(max) >= Math.abs(min) ? max : min;
  };
  var _setScrollTrigger = function _setScrollTrigger2() {
    ScrollTrigger = gsap2.core.globals().ScrollTrigger;
    ScrollTrigger && ScrollTrigger.core && _integrate();
  };
  var _initCore = function _initCore2(core) {
    gsap2 = core || _getGSAP();
    if (!_coreInitted && gsap2 && typeof document !== "undefined" && document.body) {
      _win = window;
      _doc = document;
      _docEl = _doc.documentElement;
      _body = _doc.body;
      _root = [_win, _doc, _docEl, _body];
      _clamp = gsap2.utils.clamp;
      _context = gsap2.core.context || function() {
      };
      _pointerType = "onpointerenter" in _body ? "pointer" : "mouse";
      _isTouch = Observer.isTouch = _win.matchMedia && _win.matchMedia("(hover: none), (pointer: coarse)").matches ? 1 : "ontouchstart" in _win || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0 ? 2 : 0;
      _eventTypes = Observer.eventTypes = ("ontouchstart" in _docEl ? "touchstart,touchmove,touchcancel,touchend" : !("onpointerdown" in _docEl) ? "mousedown,mousemove,mouseup,mouseup" : "pointerdown,pointermove,pointercancel,pointerup").split(",");
      setTimeout(function() {
        return _startup = 0;
      }, 500);
      _setScrollTrigger();
      _coreInitted = 1;
    }
    return _coreInitted;
  };
  _horizontal.op = _vertical;
  _scrollers.cache = 0;
  var Observer = /* @__PURE__ */ function() {
    function Observer2(vars) {
      this.init(vars);
    }
    var _proto = Observer2.prototype;
    _proto.init = function init(vars) {
      _coreInitted || _initCore(gsap2) || console.warn("Please gsap.registerPlugin(Observer)");
      ScrollTrigger || _setScrollTrigger();
      var tolerance = vars.tolerance, dragMinimum = vars.dragMinimum, type = vars.type, target = vars.target, lineHeight = vars.lineHeight, debounce2 = vars.debounce, preventDefault = vars.preventDefault, onStop = vars.onStop, onStopDelay = vars.onStopDelay, ignore = vars.ignore, wheelSpeed = vars.wheelSpeed, event = vars.event, onDragStart = vars.onDragStart, onDragEnd = vars.onDragEnd, onDrag = vars.onDrag, onPress = vars.onPress, onRelease = vars.onRelease, onRight = vars.onRight, onLeft = vars.onLeft, onUp = vars.onUp, onDown = vars.onDown, onChangeX = vars.onChangeX, onChangeY = vars.onChangeY, onChange = vars.onChange, onToggleX = vars.onToggleX, onToggleY = vars.onToggleY, onHover = vars.onHover, onHoverEnd = vars.onHoverEnd, onMove = vars.onMove, ignoreCheck = vars.ignoreCheck, isNormalizer = vars.isNormalizer, onGestureStart = vars.onGestureStart, onGestureEnd = vars.onGestureEnd, onWheel = vars.onWheel, onEnable = vars.onEnable, onDisable = vars.onDisable, onClick = vars.onClick, scrollSpeed = vars.scrollSpeed, capture = vars.capture, allowClicks = vars.allowClicks, lockAxis = vars.lockAxis, onLockAxis = vars.onLockAxis;
      this.target = target = _getTarget(target) || _docEl;
      this.vars = vars;
      ignore && (ignore = gsap2.utils.toArray(ignore));
      tolerance = tolerance || 1e-9;
      dragMinimum = dragMinimum || 0;
      wheelSpeed = wheelSpeed || 1;
      scrollSpeed = scrollSpeed || 1;
      type = type || "wheel,touch,pointer";
      debounce2 = debounce2 !== false;
      lineHeight || (lineHeight = parseFloat(_win.getComputedStyle(_body).lineHeight) || 22);
      var id, onStopDelayedCall, dragged, moved, wheeled, locked, axis, self = this, prevDeltaX = 0, prevDeltaY = 0, passive = vars.passive || !preventDefault && vars.passive !== false, scrollFuncX = _getScrollFunc(target, _horizontal), scrollFuncY = _getScrollFunc(target, _vertical), scrollX = scrollFuncX(), scrollY = scrollFuncY(), limitToTouch = ~type.indexOf("touch") && !~type.indexOf("pointer") && _eventTypes[0] === "pointerdown", isViewport = _isViewport(target), ownerDoc = target.ownerDocument || _doc, deltaX = [0, 0, 0], deltaY = [0, 0, 0], onClickTime = 0, clickCapture = function clickCapture2() {
        return onClickTime = _getTime();
      }, _ignoreCheck = function _ignoreCheck2(e2, isPointerOrTouch) {
        return (self.event = e2) && ignore && _isWithin(e2.target, ignore) || isPointerOrTouch && limitToTouch && e2.pointerType !== "touch" || ignoreCheck && ignoreCheck(e2, isPointerOrTouch);
      }, onStopFunc = function onStopFunc2() {
        self._vx.reset();
        self._vy.reset();
        onStopDelayedCall.pause();
        onStop && onStop(self);
      }, update = function update2() {
        var dx = self.deltaX = _getAbsoluteMax(deltaX), dy = self.deltaY = _getAbsoluteMax(deltaY), changedX = Math.abs(dx) >= tolerance, changedY = Math.abs(dy) >= tolerance;
        onChange && (changedX || changedY) && onChange(self, dx, dy, deltaX, deltaY);
        if (changedX) {
          onRight && self.deltaX > 0 && onRight(self);
          onLeft && self.deltaX < 0 && onLeft(self);
          onChangeX && onChangeX(self);
          onToggleX && self.deltaX < 0 !== prevDeltaX < 0 && onToggleX(self);
          prevDeltaX = self.deltaX;
          deltaX[0] = deltaX[1] = deltaX[2] = 0;
        }
        if (changedY) {
          onDown && self.deltaY > 0 && onDown(self);
          onUp && self.deltaY < 0 && onUp(self);
          onChangeY && onChangeY(self);
          onToggleY && self.deltaY < 0 !== prevDeltaY < 0 && onToggleY(self);
          prevDeltaY = self.deltaY;
          deltaY[0] = deltaY[1] = deltaY[2] = 0;
        }
        if (moved || dragged) {
          onMove && onMove(self);
          if (dragged) {
            onDragStart && dragged === 1 && onDragStart(self);
            onDrag && onDrag(self);
            dragged = 0;
          }
          moved = false;
        }
        locked && !(locked = false) && onLockAxis && onLockAxis(self);
        if (wheeled) {
          onWheel(self);
          wheeled = false;
        }
        id = 0;
      }, onDelta = function onDelta2(x, y, index) {
        deltaX[index] += x;
        deltaY[index] += y;
        self._vx.update(x);
        self._vy.update(y);
        debounce2 ? id || (id = requestAnimationFrame(update)) : update();
      }, onTouchOrPointerDelta = function onTouchOrPointerDelta2(x, y) {
        if (lockAxis && !axis) {
          self.axis = axis = Math.abs(x) > Math.abs(y) ? "x" : "y";
          locked = true;
        }
        if (axis !== "y") {
          deltaX[2] += x;
          self._vx.update(x, true);
        }
        if (axis !== "x") {
          deltaY[2] += y;
          self._vy.update(y, true);
        }
        debounce2 ? id || (id = requestAnimationFrame(update)) : update();
      }, _onDrag = function _onDrag2(e2) {
        if (_ignoreCheck(e2, 1)) {
          return;
        }
        e2 = _getEvent(e2, preventDefault);
        var x = e2.clientX, y = e2.clientY, dx = x - self.x, dy = y - self.y, isDragging = self.isDragging;
        self.x = x;
        self.y = y;
        if (isDragging || (dx || dy) && (Math.abs(self.startX - x) >= dragMinimum || Math.abs(self.startY - y) >= dragMinimum)) {
          dragged = isDragging ? 2 : 1;
          isDragging || (self.isDragging = true);
          onTouchOrPointerDelta(dx, dy);
        }
      }, _onPress = self.onPress = function(e2) {
        if (_ignoreCheck(e2, 1) || e2 && e2.button) {
          return;
        }
        self.axis = axis = null;
        onStopDelayedCall.pause();
        self.isPressed = true;
        e2 = _getEvent(e2);
        prevDeltaX = prevDeltaY = 0;
        self.startX = self.x = e2.clientX;
        self.startY = self.y = e2.clientY;
        self._vx.reset();
        self._vy.reset();
        _addListener(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, passive, true);
        self.deltaX = self.deltaY = 0;
        onPress && onPress(self);
      }, _onRelease = self.onRelease = function(e2) {
        if (_ignoreCheck(e2, 1)) {
          return;
        }
        _removeListener(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, true);
        var isTrackingDrag = !isNaN(self.y - self.startY), wasDragging = self.isDragging, isDragNotClick = wasDragging && (Math.abs(self.x - self.startX) > 3 || Math.abs(self.y - self.startY) > 3), eventData = _getEvent(e2);
        if (!isDragNotClick && isTrackingDrag) {
          self._vx.reset();
          self._vy.reset();
          if (preventDefault && allowClicks) {
            gsap2.delayedCall(0.08, function() {
              if (_getTime() - onClickTime > 300 && !e2.defaultPrevented) {
                if (e2.target.click) {
                  e2.target.click();
                } else if (ownerDoc.createEvent) {
                  var syntheticEvent = ownerDoc.createEvent("MouseEvents");
                  syntheticEvent.initMouseEvent("click", true, true, _win, 1, eventData.screenX, eventData.screenY, eventData.clientX, eventData.clientY, false, false, false, false, 0, null);
                  e2.target.dispatchEvent(syntheticEvent);
                }
              }
            });
          }
        }
        self.isDragging = self.isGesturing = self.isPressed = false;
        onStop && wasDragging && !isNormalizer && onStopDelayedCall.restart(true);
        dragged && update();
        onDragEnd && wasDragging && onDragEnd(self);
        onRelease && onRelease(self, isDragNotClick);
      }, _onGestureStart = function _onGestureStart2(e2) {
        return e2.touches && e2.touches.length > 1 && (self.isGesturing = true) && onGestureStart(e2, self.isDragging);
      }, _onGestureEnd = function _onGestureEnd2() {
        return (self.isGesturing = false) || onGestureEnd(self);
      }, onScroll = function onScroll2(e2) {
        if (_ignoreCheck(e2)) {
          return;
        }
        var x = scrollFuncX(), y = scrollFuncY();
        onDelta((x - scrollX) * scrollSpeed, (y - scrollY) * scrollSpeed, 1);
        scrollX = x;
        scrollY = y;
        onStop && onStopDelayedCall.restart(true);
      }, _onWheel = function _onWheel2(e2) {
        if (_ignoreCheck(e2)) {
          return;
        }
        e2 = _getEvent(e2, preventDefault);
        onWheel && (wheeled = true);
        var multiplier = (e2.deltaMode === 1 ? lineHeight : e2.deltaMode === 2 ? _win.innerHeight : 1) * wheelSpeed;
        onDelta(e2.deltaX * multiplier, e2.deltaY * multiplier, 0);
        onStop && !isNormalizer && onStopDelayedCall.restart(true);
      }, _onMove = function _onMove2(e2) {
        if (_ignoreCheck(e2)) {
          return;
        }
        var x = e2.clientX, y = e2.clientY, dx = x - self.x, dy = y - self.y;
        self.x = x;
        self.y = y;
        moved = true;
        onStop && onStopDelayedCall.restart(true);
        (dx || dy) && onTouchOrPointerDelta(dx, dy);
      }, _onHover = function _onHover2(e2) {
        self.event = e2;
        onHover(self);
      }, _onHoverEnd = function _onHoverEnd2(e2) {
        self.event = e2;
        onHoverEnd(self);
      }, _onClick = function _onClick2(e2) {
        return _ignoreCheck(e2) || _getEvent(e2, preventDefault) && onClick(self);
      };
      onStopDelayedCall = self._dc = gsap2.delayedCall(onStopDelay || 0.25, onStopFunc).pause();
      self.deltaX = self.deltaY = 0;
      self._vx = _getVelocityProp(0, 50, true);
      self._vy = _getVelocityProp(0, 50, true);
      self.scrollX = scrollFuncX;
      self.scrollY = scrollFuncY;
      self.isDragging = self.isGesturing = self.isPressed = false;
      _context(this);
      self.enable = function(e2) {
        if (!self.isEnabled) {
          _addListener(isViewport ? ownerDoc : target, "scroll", _onScroll);
          type.indexOf("scroll") >= 0 && _addListener(isViewport ? ownerDoc : target, "scroll", onScroll, passive, capture);
          type.indexOf("wheel") >= 0 && _addListener(target, "wheel", _onWheel, passive, capture);
          if (type.indexOf("touch") >= 0 && _isTouch || type.indexOf("pointer") >= 0) {
            _addListener(target, _eventTypes[0], _onPress, passive, capture);
            _addListener(ownerDoc, _eventTypes[2], _onRelease);
            _addListener(ownerDoc, _eventTypes[3], _onRelease);
            allowClicks && _addListener(target, "click", clickCapture, true, true);
            onClick && _addListener(target, "click", _onClick);
            onGestureStart && _addListener(ownerDoc, "gesturestart", _onGestureStart);
            onGestureEnd && _addListener(ownerDoc, "gestureend", _onGestureEnd);
            onHover && _addListener(target, _pointerType + "enter", _onHover);
            onHoverEnd && _addListener(target, _pointerType + "leave", _onHoverEnd);
            onMove && _addListener(target, _pointerType + "move", _onMove);
          }
          self.isEnabled = true;
          self.isDragging = self.isGesturing = self.isPressed = moved = dragged = false;
          self._vx.reset();
          self._vy.reset();
          scrollX = scrollFuncX();
          scrollY = scrollFuncY();
          e2 && e2.type && _onPress(e2);
          onEnable && onEnable(self);
        }
        return self;
      };
      self.disable = function() {
        if (self.isEnabled) {
          _observers.filter(function(o2) {
            return o2 !== self && _isViewport(o2.target);
          }).length || _removeListener(isViewport ? ownerDoc : target, "scroll", _onScroll);
          if (self.isPressed) {
            self._vx.reset();
            self._vy.reset();
            _removeListener(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, true);
          }
          _removeListener(isViewport ? ownerDoc : target, "scroll", onScroll, capture);
          _removeListener(target, "wheel", _onWheel, capture);
          _removeListener(target, _eventTypes[0], _onPress, capture);
          _removeListener(ownerDoc, _eventTypes[2], _onRelease);
          _removeListener(ownerDoc, _eventTypes[3], _onRelease);
          _removeListener(target, "click", clickCapture, true);
          _removeListener(target, "click", _onClick);
          _removeListener(ownerDoc, "gesturestart", _onGestureStart);
          _removeListener(ownerDoc, "gestureend", _onGestureEnd);
          _removeListener(target, _pointerType + "enter", _onHover);
          _removeListener(target, _pointerType + "leave", _onHoverEnd);
          _removeListener(target, _pointerType + "move", _onMove);
          self.isEnabled = self.isPressed = self.isDragging = false;
          onDisable && onDisable(self);
        }
      };
      self.kill = self.revert = function() {
        self.disable();
        var i2 = _observers.indexOf(self);
        i2 >= 0 && _observers.splice(i2, 1);
        _normalizer === self && (_normalizer = 0);
      };
      _observers.push(self);
      isNormalizer && _isViewport(target) && (_normalizer = self);
      self.enable(event);
    };
    _createClass(Observer2, [{
      key: "velocityX",
      get: function get() {
        return this._vx.getVelocity();
      }
    }, {
      key: "velocityY",
      get: function get() {
        return this._vy.getVelocity();
      }
    }]);
    return Observer2;
  }();
  Observer.version = "3.13.0";
  Observer.create = function(vars) {
    return new Observer(vars);
  };
  Observer.register = _initCore;
  Observer.getAll = function() {
    return _observers.slice();
  };
  Observer.getById = function(id) {
    return _observers.filter(function(o2) {
      return o2.vars.id === id;
    })[0];
  };
  _getGSAP() && gsap2.registerPlugin(Observer);

  // node_modules/gsap/ScrollTrigger.js
  var gsap3;
  var _coreInitted2;
  var _win2;
  var _doc2;
  var _docEl2;
  var _body2;
  var _root2;
  var _resizeDelay;
  var _toArray;
  var _clamp2;
  var _time2;
  var _syncInterval;
  var _refreshing;
  var _pointerIsDown;
  var _transformProp;
  var _i;
  var _prevWidth;
  var _prevHeight;
  var _autoRefresh;
  var _sort;
  var _suppressOverwrites;
  var _ignoreResize;
  var _normalizer2;
  var _ignoreMobileResize;
  var _baseScreenHeight;
  var _baseScreenWidth;
  var _fixIOSBug;
  var _context2;
  var _scrollRestoration;
  var _div100vh;
  var _100vh;
  var _isReverted;
  var _clampingMax;
  var _limitCallbacks;
  var _startup2 = 1;
  var _getTime2 = Date.now;
  var _time1 = _getTime2();
  var _lastScrollTime = 0;
  var _enabled = 0;
  var _parseClamp = function _parseClamp2(value, type, self) {
    var clamp2 = _isString(value) && (value.substr(0, 6) === "clamp(" || value.indexOf("max") > -1);
    self["_" + type + "Clamp"] = clamp2;
    return clamp2 ? value.substr(6, value.length - 7) : value;
  };
  var _keepClamp = function _keepClamp2(value, clamp2) {
    return clamp2 && (!_isString(value) || value.substr(0, 6) !== "clamp(") ? "clamp(" + value + ")" : value;
  };
  var _rafBugFix = function _rafBugFix2() {
    return _enabled && requestAnimationFrame(_rafBugFix2);
  };
  var _pointerDownHandler = function _pointerDownHandler2() {
    return _pointerIsDown = 1;
  };
  var _pointerUpHandler = function _pointerUpHandler2() {
    return _pointerIsDown = 0;
  };
  var _passThrough = function _passThrough2(v) {
    return v;
  };
  var _round = function _round2(value) {
    return Math.round(value * 1e5) / 1e5 || 0;
  };
  var _windowExists = function _windowExists2() {
    return typeof window !== "undefined";
  };
  var _getGSAP3 = function _getGSAP4() {
    return gsap3 || _windowExists() && (gsap3 = window.gsap) && gsap3.registerPlugin && gsap3;
  };
  var _isViewport3 = function _isViewport4(e2) {
    return !!~_root2.indexOf(e2);
  };
  var _getViewportDimension = function _getViewportDimension2(dimensionProperty) {
    return (dimensionProperty === "Height" ? _100vh : _win2["inner" + dimensionProperty]) || _docEl2["client" + dimensionProperty] || _body2["client" + dimensionProperty];
  };
  var _getBoundsFunc = function _getBoundsFunc2(element) {
    return _getProxyProp(element, "getBoundingClientRect") || (_isViewport3(element) ? function() {
      _winOffsets.width = _win2.innerWidth;
      _winOffsets.height = _100vh;
      return _winOffsets;
    } : function() {
      return _getBounds(element);
    });
  };
  var _getSizeFunc = function _getSizeFunc2(scroller, isViewport, _ref) {
    var d2 = _ref.d, d22 = _ref.d2, a2 = _ref.a;
    return (a2 = _getProxyProp(scroller, "getBoundingClientRect")) ? function() {
      return a2()[d2];
    } : function() {
      return (isViewport ? _getViewportDimension(d22) : scroller["client" + d22]) || 0;
    };
  };
  var _getOffsetsFunc = function _getOffsetsFunc2(element, isViewport) {
    return !isViewport || ~_proxies.indexOf(element) ? _getBoundsFunc(element) : function() {
      return _winOffsets;
    };
  };
  var _maxScroll = function _maxScroll2(element, _ref2) {
    var s2 = _ref2.s, d2 = _ref2.d2, d3 = _ref2.d, a2 = _ref2.a;
    return Math.max(0, (s2 = "scroll" + d2) && (a2 = _getProxyProp(element, s2)) ? a2() - _getBoundsFunc(element)()[d3] : _isViewport3(element) ? (_docEl2[s2] || _body2[s2]) - _getViewportDimension(d2) : element[s2] - element["offset" + d2]);
  };
  var _iterateAutoRefresh = function _iterateAutoRefresh2(func, events) {
    for (var i2 = 0; i2 < _autoRefresh.length; i2 += 3) {
      (!events || ~events.indexOf(_autoRefresh[i2 + 1])) && func(_autoRefresh[i2], _autoRefresh[i2 + 1], _autoRefresh[i2 + 2]);
    }
  };
  var _isString = function _isString2(value) {
    return typeof value === "string";
  };
  var _isFunction = function _isFunction2(value) {
    return typeof value === "function";
  };
  var _isNumber = function _isNumber2(value) {
    return typeof value === "number";
  };
  var _isObject = function _isObject2(value) {
    return typeof value === "object";
  };
  var _endAnimation = function _endAnimation2(animation, reversed, pause) {
    return animation && animation.progress(reversed ? 0 : 1) && pause && animation.pause();
  };
  var _callback = function _callback2(self, func) {
    if (self.enabled) {
      var result = self._ctx ? self._ctx.add(function() {
        return func(self);
      }) : func(self);
      result && result.totalTime && (self.callbackAnimation = result);
    }
  };
  var _abs = Math.abs;
  var _left = "left";
  var _top = "top";
  var _right = "right";
  var _bottom = "bottom";
  var _width = "width";
  var _height = "height";
  var _Right = "Right";
  var _Left = "Left";
  var _Top = "Top";
  var _Bottom = "Bottom";
  var _padding = "padding";
  var _margin = "margin";
  var _Width = "Width";
  var _Height = "Height";
  var _px = "px";
  var _getComputedStyle = function _getComputedStyle2(element) {
    return _win2.getComputedStyle(element);
  };
  var _makePositionable = function _makePositionable2(element) {
    var position = _getComputedStyle(element).position;
    element.style.position = position === "absolute" || position === "fixed" ? position : "relative";
  };
  var _setDefaults = function _setDefaults2(obj, defaults) {
    for (var p2 in defaults) {
      p2 in obj || (obj[p2] = defaults[p2]);
    }
    return obj;
  };
  var _getBounds = function _getBounds2(element, withoutTransforms) {
    var tween = withoutTransforms && _getComputedStyle(element)[_transformProp] !== "matrix(1, 0, 0, 1, 0, 0)" && gsap3.to(element, {
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      rotation: 0,
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      skewX: 0,
      skewY: 0
    }).progress(1), bounds = element.getBoundingClientRect();
    tween && tween.progress(0).kill();
    return bounds;
  };
  var _getSize = function _getSize2(element, _ref3) {
    var d2 = _ref3.d2;
    return element["offset" + d2] || element["client" + d2] || 0;
  };
  var _getLabelRatioArray = function _getLabelRatioArray2(timeline) {
    var a2 = [], labels = timeline.labels, duration = timeline.duration(), p2;
    for (p2 in labels) {
      a2.push(labels[p2] / duration);
    }
    return a2;
  };
  var _getClosestLabel = function _getClosestLabel2(animation) {
    return function(value) {
      return gsap3.utils.snap(_getLabelRatioArray(animation), value);
    };
  };
  var _snapDirectional = function _snapDirectional2(snapIncrementOrArray) {
    var snap = gsap3.utils.snap(snapIncrementOrArray), a2 = Array.isArray(snapIncrementOrArray) && snapIncrementOrArray.slice(0).sort(function(a3, b) {
      return a3 - b;
    });
    return a2 ? function(value, direction, threshold) {
      if (threshold === void 0) {
        threshold = 1e-3;
      }
      var i2;
      if (!direction) {
        return snap(value);
      }
      if (direction > 0) {
        value -= threshold;
        for (i2 = 0; i2 < a2.length; i2++) {
          if (a2[i2] >= value) {
            return a2[i2];
          }
        }
        return a2[i2 - 1];
      } else {
        i2 = a2.length;
        value += threshold;
        while (i2--) {
          if (a2[i2] <= value) {
            return a2[i2];
          }
        }
      }
      return a2[0];
    } : function(value, direction, threshold) {
      if (threshold === void 0) {
        threshold = 1e-3;
      }
      var snapped = snap(value);
      return !direction || Math.abs(snapped - value) < threshold || snapped - value < 0 === direction < 0 ? snapped : snap(direction < 0 ? value - snapIncrementOrArray : value + snapIncrementOrArray);
    };
  };
  var _getLabelAtDirection = function _getLabelAtDirection2(timeline) {
    return function(value, st) {
      return _snapDirectional(_getLabelRatioArray(timeline))(value, st.direction);
    };
  };
  var _multiListener = function _multiListener2(func, element, types, callback) {
    return types.split(",").forEach(function(type) {
      return func(element, type, callback);
    });
  };
  var _addListener3 = function _addListener4(element, type, func, nonPassive, capture) {
    return element.addEventListener(type, func, {
      passive: !nonPassive,
      capture: !!capture
    });
  };
  var _removeListener3 = function _removeListener4(element, type, func, capture) {
    return element.removeEventListener(type, func, !!capture);
  };
  var _wheelListener = function _wheelListener2(func, el, scrollFunc) {
    scrollFunc = scrollFunc && scrollFunc.wheelHandler;
    if (scrollFunc) {
      func(el, "wheel", scrollFunc);
      func(el, "touchmove", scrollFunc);
    }
  };
  var _markerDefaults = {
    startColor: "green",
    endColor: "red",
    indent: 0,
    fontSize: "16px",
    fontWeight: "normal"
  };
  var _defaults = {
    toggleActions: "play",
    anticipatePin: 0
  };
  var _keywords = {
    top: 0,
    left: 0,
    center: 0.5,
    bottom: 1,
    right: 1
  };
  var _offsetToPx = function _offsetToPx2(value, size) {
    if (_isString(value)) {
      var eqIndex = value.indexOf("="), relative = ~eqIndex ? +(value.charAt(eqIndex - 1) + 1) * parseFloat(value.substr(eqIndex + 1)) : 0;
      if (~eqIndex) {
        value.indexOf("%") > eqIndex && (relative *= size / 100);
        value = value.substr(0, eqIndex - 1);
      }
      value = relative + (value in _keywords ? _keywords[value] * size : ~value.indexOf("%") ? parseFloat(value) * size / 100 : parseFloat(value) || 0);
    }
    return value;
  };
  var _createMarker = function _createMarker2(type, name, container, direction, _ref4, offset, matchWidthEl, containerAnimation) {
    var startColor = _ref4.startColor, endColor = _ref4.endColor, fontSize = _ref4.fontSize, indent = _ref4.indent, fontWeight = _ref4.fontWeight;
    var e2 = _doc2.createElement("div"), useFixedPosition = _isViewport3(container) || _getProxyProp(container, "pinType") === "fixed", isScroller = type.indexOf("scroller") !== -1, parent = useFixedPosition ? _body2 : container, isStart = type.indexOf("start") !== -1, color = isStart ? startColor : endColor, css = "border-color:" + color + ";font-size:" + fontSize + ";color:" + color + ";font-weight:" + fontWeight + ";pointer-events:none;white-space:nowrap;font-family:sans-serif,Arial;z-index:1000;padding:4px 8px;border-width:0;border-style:solid;";
    css += "position:" + ((isScroller || containerAnimation) && useFixedPosition ? "fixed;" : "absolute;");
    (isScroller || containerAnimation || !useFixedPosition) && (css += (direction === _vertical ? _right : _bottom) + ":" + (offset + parseFloat(indent)) + "px;");
    matchWidthEl && (css += "box-sizing:border-box;text-align:left;width:" + matchWidthEl.offsetWidth + "px;");
    e2._isStart = isStart;
    e2.setAttribute("class", "gsap-marker-" + type + (name ? " marker-" + name : ""));
    e2.style.cssText = css;
    e2.innerText = name || name === 0 ? type + "-" + name : type;
    parent.children[0] ? parent.insertBefore(e2, parent.children[0]) : parent.appendChild(e2);
    e2._offset = e2["offset" + direction.op.d2];
    _positionMarker(e2, 0, direction, isStart);
    return e2;
  };
  var _positionMarker = function _positionMarker2(marker, start, direction, flipped) {
    var vars = {
      display: "block"
    }, side = direction[flipped ? "os2" : "p2"], oppositeSide = direction[flipped ? "p2" : "os2"];
    marker._isFlipped = flipped;
    vars[direction.a + "Percent"] = flipped ? -100 : 0;
    vars[direction.a] = flipped ? "1px" : 0;
    vars["border" + side + _Width] = 1;
    vars["border" + oppositeSide + _Width] = 0;
    vars[direction.p] = start + "px";
    gsap3.set(marker, vars);
  };
  var _triggers = [];
  var _ids = {};
  var _rafID;
  var _sync = function _sync2() {
    return _getTime2() - _lastScrollTime > 34 && (_rafID || (_rafID = requestAnimationFrame(_updateAll)));
  };
  var _onScroll3 = function _onScroll4() {
    if (!_normalizer2 || !_normalizer2.isPressed || _normalizer2.startX > _body2.clientWidth) {
      _scrollers.cache++;
      if (_normalizer2) {
        _rafID || (_rafID = requestAnimationFrame(_updateAll));
      } else {
        _updateAll();
      }
      _lastScrollTime || _dispatch("scrollStart");
      _lastScrollTime = _getTime2();
    }
  };
  var _setBaseDimensions = function _setBaseDimensions2() {
    _baseScreenWidth = _win2.innerWidth;
    _baseScreenHeight = _win2.innerHeight;
  };
  var _onResize = function _onResize2(force) {
    _scrollers.cache++;
    (force === true || !_refreshing && !_ignoreResize && !_doc2.fullscreenElement && !_doc2.webkitFullscreenElement && (!_ignoreMobileResize || _baseScreenWidth !== _win2.innerWidth || Math.abs(_win2.innerHeight - _baseScreenHeight) > _win2.innerHeight * 0.25)) && _resizeDelay.restart(true);
  };
  var _listeners = {};
  var _emptyArray = [];
  var _softRefresh = function _softRefresh2() {
    return _removeListener3(ScrollTrigger2, "scrollEnd", _softRefresh2) || _refreshAll(true);
  };
  var _dispatch = function _dispatch2(type) {
    return _listeners[type] && _listeners[type].map(function(f2) {
      return f2();
    }) || _emptyArray;
  };
  var _savedStyles = [];
  var _revertRecorded = function _revertRecorded2(media) {
    for (var i2 = 0; i2 < _savedStyles.length; i2 += 5) {
      if (!media || _savedStyles[i2 + 4] && _savedStyles[i2 + 4].query === media) {
        _savedStyles[i2].style.cssText = _savedStyles[i2 + 1];
        _savedStyles[i2].getBBox && _savedStyles[i2].setAttribute("transform", _savedStyles[i2 + 2] || "");
        _savedStyles[i2 + 3].uncache = 1;
      }
    }
  };
  var _revertAll = function _revertAll2(kill, media) {
    var trigger;
    for (_i = 0; _i < _triggers.length; _i++) {
      trigger = _triggers[_i];
      if (trigger && (!media || trigger._ctx === media)) {
        if (kill) {
          trigger.kill(1);
        } else {
          trigger.revert(true, true);
        }
      }
    }
    _isReverted = true;
    media && _revertRecorded(media);
    media || _dispatch("revert");
  };
  var _clearScrollMemory = function _clearScrollMemory2(scrollRestoration, force) {
    _scrollers.cache++;
    (force || !_refreshingAll) && _scrollers.forEach(function(obj) {
      return _isFunction(obj) && obj.cacheID++ && (obj.rec = 0);
    });
    _isString(scrollRestoration) && (_win2.history.scrollRestoration = _scrollRestoration = scrollRestoration);
  };
  var _refreshingAll;
  var _refreshID = 0;
  var _queueRefreshID;
  var _queueRefreshAll = function _queueRefreshAll2() {
    if (_queueRefreshID !== _refreshID) {
      var id = _queueRefreshID = _refreshID;
      requestAnimationFrame(function() {
        return id === _refreshID && _refreshAll(true);
      });
    }
  };
  var _refresh100vh = function _refresh100vh2() {
    _body2.appendChild(_div100vh);
    _100vh = !_normalizer2 && _div100vh.offsetHeight || _win2.innerHeight;
    _body2.removeChild(_div100vh);
  };
  var _hideAllMarkers = function _hideAllMarkers2(hide) {
    return _toArray(".gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end").forEach(function(el) {
      return el.style.display = hide ? "none" : "block";
    });
  };
  var _refreshAll = function _refreshAll2(force, skipRevert) {
    _docEl2 = _doc2.documentElement;
    _body2 = _doc2.body;
    _root2 = [_win2, _doc2, _docEl2, _body2];
    if (_lastScrollTime && !force && !_isReverted) {
      _addListener3(ScrollTrigger2, "scrollEnd", _softRefresh);
      return;
    }
    _refresh100vh();
    _refreshingAll = ScrollTrigger2.isRefreshing = true;
    _scrollers.forEach(function(obj) {
      return _isFunction(obj) && ++obj.cacheID && (obj.rec = obj());
    });
    var refreshInits = _dispatch("refreshInit");
    _sort && ScrollTrigger2.sort();
    skipRevert || _revertAll();
    _scrollers.forEach(function(obj) {
      if (_isFunction(obj)) {
        obj.smooth && (obj.target.style.scrollBehavior = "auto");
        obj(0);
      }
    });
    _triggers.slice(0).forEach(function(t2) {
      return t2.refresh();
    });
    _isReverted = false;
    _triggers.forEach(function(t2) {
      if (t2._subPinOffset && t2.pin) {
        var prop = t2.vars.horizontal ? "offsetWidth" : "offsetHeight", original = t2.pin[prop];
        t2.revert(true, 1);
        t2.adjustPinSpacing(t2.pin[prop] - original);
        t2.refresh();
      }
    });
    _clampingMax = 1;
    _hideAllMarkers(true);
    _triggers.forEach(function(t2) {
      var max = _maxScroll(t2.scroller, t2._dir), endClamp = t2.vars.end === "max" || t2._endClamp && t2.end > max, startClamp = t2._startClamp && t2.start >= max;
      (endClamp || startClamp) && t2.setPositions(startClamp ? max - 1 : t2.start, endClamp ? Math.max(startClamp ? max : t2.start + 1, max) : t2.end, true);
    });
    _hideAllMarkers(false);
    _clampingMax = 0;
    refreshInits.forEach(function(result) {
      return result && result.render && result.render(-1);
    });
    _scrollers.forEach(function(obj) {
      if (_isFunction(obj)) {
        obj.smooth && requestAnimationFrame(function() {
          return obj.target.style.scrollBehavior = "smooth";
        });
        obj.rec && obj(obj.rec);
      }
    });
    _clearScrollMemory(_scrollRestoration, 1);
    _resizeDelay.pause();
    _refreshID++;
    _refreshingAll = 2;
    _updateAll(2);
    _triggers.forEach(function(t2) {
      return _isFunction(t2.vars.onRefresh) && t2.vars.onRefresh(t2);
    });
    _refreshingAll = ScrollTrigger2.isRefreshing = false;
    _dispatch("refresh");
  };
  var _lastScroll = 0;
  var _direction = 1;
  var _primary;
  var _updateAll = function _updateAll2(force) {
    if (force === 2 || !_refreshingAll && !_isReverted) {
      ScrollTrigger2.isUpdating = true;
      _primary && _primary.update(0);
      var l2 = _triggers.length, time = _getTime2(), recordVelocity = time - _time1 >= 50, scroll = l2 && _triggers[0].scroll();
      _direction = _lastScroll > scroll ? -1 : 1;
      _refreshingAll || (_lastScroll = scroll);
      if (recordVelocity) {
        if (_lastScrollTime && !_pointerIsDown && time - _lastScrollTime > 200) {
          _lastScrollTime = 0;
          _dispatch("scrollEnd");
        }
        _time2 = _time1;
        _time1 = time;
      }
      if (_direction < 0) {
        _i = l2;
        while (_i-- > 0) {
          _triggers[_i] && _triggers[_i].update(0, recordVelocity);
        }
        _direction = 1;
      } else {
        for (_i = 0; _i < l2; _i++) {
          _triggers[_i] && _triggers[_i].update(0, recordVelocity);
        }
      }
      ScrollTrigger2.isUpdating = false;
    }
    _rafID = 0;
  };
  var _propNamesToCopy = [_left, _top, _bottom, _right, _margin + _Bottom, _margin + _Right, _margin + _Top, _margin + _Left, "display", "flexShrink", "float", "zIndex", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd", "gridArea", "justifySelf", "alignSelf", "placeSelf", "order"];
  var _stateProps = _propNamesToCopy.concat([_width, _height, "boxSizing", "max" + _Width, "max" + _Height, "position", _margin, _padding, _padding + _Top, _padding + _Right, _padding + _Bottom, _padding + _Left]);
  var _swapPinOut = function _swapPinOut2(pin, spacer, state) {
    _setState(state);
    var cache = pin._gsap;
    if (cache.spacerIsNative) {
      _setState(cache.spacerState);
    } else if (pin._gsap.swappedIn) {
      var parent = spacer.parentNode;
      if (parent) {
        parent.insertBefore(pin, spacer);
        parent.removeChild(spacer);
      }
    }
    pin._gsap.swappedIn = false;
  };
  var _swapPinIn = function _swapPinIn2(pin, spacer, cs, spacerState) {
    if (!pin._gsap.swappedIn) {
      var i2 = _propNamesToCopy.length, spacerStyle = spacer.style, pinStyle = pin.style, p2;
      while (i2--) {
        p2 = _propNamesToCopy[i2];
        spacerStyle[p2] = cs[p2];
      }
      spacerStyle.position = cs.position === "absolute" ? "absolute" : "relative";
      cs.display === "inline" && (spacerStyle.display = "inline-block");
      pinStyle[_bottom] = pinStyle[_right] = "auto";
      spacerStyle.flexBasis = cs.flexBasis || "auto";
      spacerStyle.overflow = "visible";
      spacerStyle.boxSizing = "border-box";
      spacerStyle[_width] = _getSize(pin, _horizontal) + _px;
      spacerStyle[_height] = _getSize(pin, _vertical) + _px;
      spacerStyle[_padding] = pinStyle[_margin] = pinStyle[_top] = pinStyle[_left] = "0";
      _setState(spacerState);
      pinStyle[_width] = pinStyle["max" + _Width] = cs[_width];
      pinStyle[_height] = pinStyle["max" + _Height] = cs[_height];
      pinStyle[_padding] = cs[_padding];
      if (pin.parentNode !== spacer) {
        pin.parentNode.insertBefore(spacer, pin);
        spacer.appendChild(pin);
      }
      pin._gsap.swappedIn = true;
    }
  };
  var _capsExp = /([A-Z])/g;
  var _setState = function _setState2(state) {
    if (state) {
      var style = state.t.style, l2 = state.length, i2 = 0, p2, value;
      (state.t._gsap || gsap3.core.getCache(state.t)).uncache = 1;
      for (; i2 < l2; i2 += 2) {
        value = state[i2 + 1];
        p2 = state[i2];
        if (value) {
          style[p2] = value;
        } else if (style[p2]) {
          style.removeProperty(p2.replace(_capsExp, "-$1").toLowerCase());
        }
      }
    }
  };
  var _getState = function _getState2(element) {
    var l2 = _stateProps.length, style = element.style, state = [], i2 = 0;
    for (; i2 < l2; i2++) {
      state.push(_stateProps[i2], style[_stateProps[i2]]);
    }
    state.t = element;
    return state;
  };
  var _copyState = function _copyState2(state, override, omitOffsets) {
    var result = [], l2 = state.length, i2 = omitOffsets ? 8 : 0, p2;
    for (; i2 < l2; i2 += 2) {
      p2 = state[i2];
      result.push(p2, p2 in override ? override[p2] : state[i2 + 1]);
    }
    result.t = state.t;
    return result;
  };
  var _winOffsets = {
    left: 0,
    top: 0
  };
  var _parsePosition = function _parsePosition2(value, trigger, scrollerSize, direction, scroll, marker, markerScroller, self, scrollerBounds, borderWidth, useFixedPosition, scrollerMax, containerAnimation, clampZeroProp) {
    _isFunction(value) && (value = value(self));
    if (_isString(value) && value.substr(0, 3) === "max") {
      value = scrollerMax + (value.charAt(4) === "=" ? _offsetToPx("0" + value.substr(3), scrollerSize) : 0);
    }
    var time = containerAnimation ? containerAnimation.time() : 0, p1, p2, element;
    containerAnimation && containerAnimation.seek(0);
    isNaN(value) || (value = +value);
    if (!_isNumber(value)) {
      _isFunction(trigger) && (trigger = trigger(self));
      var offsets = (value || "0").split(" "), bounds, localOffset, globalOffset, display;
      element = _getTarget(trigger, self) || _body2;
      bounds = _getBounds(element) || {};
      if ((!bounds || !bounds.left && !bounds.top) && _getComputedStyle(element).display === "none") {
        display = element.style.display;
        element.style.display = "block";
        bounds = _getBounds(element);
        display ? element.style.display = display : element.style.removeProperty("display");
      }
      localOffset = _offsetToPx(offsets[0], bounds[direction.d]);
      globalOffset = _offsetToPx(offsets[1] || "0", scrollerSize);
      value = bounds[direction.p] - scrollerBounds[direction.p] - borderWidth + localOffset + scroll - globalOffset;
      markerScroller && _positionMarker(markerScroller, globalOffset, direction, scrollerSize - globalOffset < 20 || markerScroller._isStart && globalOffset > 20);
      scrollerSize -= scrollerSize - globalOffset;
    } else {
      containerAnimation && (value = gsap3.utils.mapRange(containerAnimation.scrollTrigger.start, containerAnimation.scrollTrigger.end, 0, scrollerMax, value));
      markerScroller && _positionMarker(markerScroller, scrollerSize, direction, true);
    }
    if (clampZeroProp) {
      self[clampZeroProp] = value || -1e-3;
      value < 0 && (value = 0);
    }
    if (marker) {
      var position = value + scrollerSize, isStart = marker._isStart;
      p1 = "scroll" + direction.d2;
      _positionMarker(marker, position, direction, isStart && position > 20 || !isStart && (useFixedPosition ? Math.max(_body2[p1], _docEl2[p1]) : marker.parentNode[p1]) <= position + 1);
      if (useFixedPosition) {
        scrollerBounds = _getBounds(markerScroller);
        useFixedPosition && (marker.style[direction.op.p] = scrollerBounds[direction.op.p] - direction.op.m - marker._offset + _px);
      }
    }
    if (containerAnimation && element) {
      p1 = _getBounds(element);
      containerAnimation.seek(scrollerMax);
      p2 = _getBounds(element);
      containerAnimation._caScrollDist = p1[direction.p] - p2[direction.p];
      value = value / containerAnimation._caScrollDist * scrollerMax;
    }
    containerAnimation && containerAnimation.seek(time);
    return containerAnimation ? value : Math.round(value);
  };
  var _prefixExp = /(webkit|moz|length|cssText|inset)/i;
  var _reparent = function _reparent2(element, parent, top, left) {
    if (element.parentNode !== parent) {
      var style = element.style, p2, cs;
      if (parent === _body2) {
        element._stOrig = style.cssText;
        cs = _getComputedStyle(element);
        for (p2 in cs) {
          if (!+p2 && !_prefixExp.test(p2) && cs[p2] && typeof style[p2] === "string" && p2 !== "0") {
            style[p2] = cs[p2];
          }
        }
        style.top = top;
        style.left = left;
      } else {
        style.cssText = element._stOrig;
      }
      gsap3.core.getCache(element).uncache = 1;
      parent.appendChild(element);
    }
  };
  var _interruptionTracker = function _interruptionTracker2(getValueFunc, initialValue, onInterrupt) {
    var last1 = initialValue, last2 = last1;
    return function(value) {
      var current = Math.round(getValueFunc());
      if (current !== last1 && current !== last2 && Math.abs(current - last1) > 3 && Math.abs(current - last2) > 3) {
        value = current;
        onInterrupt && onInterrupt();
      }
      last2 = last1;
      last1 = Math.round(value);
      return last1;
    };
  };
  var _shiftMarker = function _shiftMarker2(marker, direction, value) {
    var vars = {};
    vars[direction.p] = "+=" + value;
    gsap3.set(marker, vars);
  };
  var _getTweenCreator = function _getTweenCreator2(scroller, direction) {
    var getScroll = _getScrollFunc(scroller, direction), prop = "_scroll" + direction.p2, getTween = function getTween2(scrollTo, vars, initialValue, change1, change2) {
      var tween = getTween2.tween, onComplete = vars.onComplete, modifiers = {};
      initialValue = initialValue || getScroll();
      var checkForInterruption = _interruptionTracker(getScroll, initialValue, function() {
        tween.kill();
        getTween2.tween = 0;
      });
      change2 = change1 && change2 || 0;
      change1 = change1 || scrollTo - initialValue;
      tween && tween.kill();
      vars[prop] = scrollTo;
      vars.inherit = false;
      vars.modifiers = modifiers;
      modifiers[prop] = function() {
        return checkForInterruption(initialValue + change1 * tween.ratio + change2 * tween.ratio * tween.ratio);
      };
      vars.onUpdate = function() {
        _scrollers.cache++;
        getTween2.tween && _updateAll();
      };
      vars.onComplete = function() {
        getTween2.tween = 0;
        onComplete && onComplete.call(tween);
      };
      tween = getTween2.tween = gsap3.to(scroller, vars);
      return tween;
    };
    scroller[prop] = getScroll;
    getScroll.wheelHandler = function() {
      return getTween.tween && getTween.tween.kill() && (getTween.tween = 0);
    };
    _addListener3(scroller, "wheel", getScroll.wheelHandler);
    ScrollTrigger2.isTouch && _addListener3(scroller, "touchmove", getScroll.wheelHandler);
    return getTween;
  };
  var ScrollTrigger2 = /* @__PURE__ */ function() {
    function ScrollTrigger3(vars, animation) {
      _coreInitted2 || ScrollTrigger3.register(gsap3) || console.warn("Please gsap.registerPlugin(ScrollTrigger)");
      _context2(this);
      this.init(vars, animation);
    }
    var _proto = ScrollTrigger3.prototype;
    _proto.init = function init(vars, animation) {
      this.progress = this.start = 0;
      this.vars && this.kill(true, true);
      if (!_enabled) {
        this.update = this.refresh = this.kill = _passThrough;
        return;
      }
      vars = _setDefaults(_isString(vars) || _isNumber(vars) || vars.nodeType ? {
        trigger: vars
      } : vars, _defaults);
      var _vars = vars, onUpdate = _vars.onUpdate, toggleClass = _vars.toggleClass, id = _vars.id, onToggle = _vars.onToggle, onRefresh = _vars.onRefresh, scrub = _vars.scrub, trigger = _vars.trigger, pin = _vars.pin, pinSpacing = _vars.pinSpacing, invalidateOnRefresh = _vars.invalidateOnRefresh, anticipatePin = _vars.anticipatePin, onScrubComplete = _vars.onScrubComplete, onSnapComplete = _vars.onSnapComplete, once = _vars.once, snap = _vars.snap, pinReparent = _vars.pinReparent, pinSpacer = _vars.pinSpacer, containerAnimation = _vars.containerAnimation, fastScrollEnd = _vars.fastScrollEnd, preventOverlaps = _vars.preventOverlaps, direction = vars.horizontal || vars.containerAnimation && vars.horizontal !== false ? _horizontal : _vertical, isToggle = !scrub && scrub !== 0, scroller = _getTarget(vars.scroller || _win2), scrollerCache = gsap3.core.getCache(scroller), isViewport = _isViewport3(scroller), useFixedPosition = ("pinType" in vars ? vars.pinType : _getProxyProp(scroller, "pinType") || isViewport && "fixed") === "fixed", callbacks = [vars.onEnter, vars.onLeave, vars.onEnterBack, vars.onLeaveBack], toggleActions = isToggle && vars.toggleActions.split(" "), markers = "markers" in vars ? vars.markers : _defaults.markers, borderWidth = isViewport ? 0 : parseFloat(_getComputedStyle(scroller)["border" + direction.p2 + _Width]) || 0, self = this, onRefreshInit = vars.onRefreshInit && function() {
        return vars.onRefreshInit(self);
      }, getScrollerSize = _getSizeFunc(scroller, isViewport, direction), getScrollerOffsets = _getOffsetsFunc(scroller, isViewport), lastSnap = 0, lastRefresh = 0, prevProgress = 0, scrollFunc = _getScrollFunc(scroller, direction), tweenTo, pinCache, snapFunc, scroll1, scroll2, start, end, markerStart, markerEnd, markerStartTrigger, markerEndTrigger, markerVars, executingOnRefresh, change, pinOriginalState, pinActiveState, pinState, spacer, offset, pinGetter, pinSetter, pinStart, pinChange, spacingStart, spacerState, markerStartSetter, pinMoves, markerEndSetter, cs, snap1, snap2, scrubTween, scrubSmooth, snapDurClamp, snapDelayedCall, prevScroll, prevAnimProgress, caMarkerSetter, customRevertReturn;
      self._startClamp = self._endClamp = false;
      self._dir = direction;
      anticipatePin *= 45;
      self.scroller = scroller;
      self.scroll = containerAnimation ? containerAnimation.time.bind(containerAnimation) : scrollFunc;
      scroll1 = scrollFunc();
      self.vars = vars;
      animation = animation || vars.animation;
      if ("refreshPriority" in vars) {
        _sort = 1;
        vars.refreshPriority === -9999 && (_primary = self);
      }
      scrollerCache.tweenScroll = scrollerCache.tweenScroll || {
        top: _getTweenCreator(scroller, _vertical),
        left: _getTweenCreator(scroller, _horizontal)
      };
      self.tweenTo = tweenTo = scrollerCache.tweenScroll[direction.p];
      self.scrubDuration = function(value) {
        scrubSmooth = _isNumber(value) && value;
        if (!scrubSmooth) {
          scrubTween && scrubTween.progress(1).kill();
          scrubTween = 0;
        } else {
          scrubTween ? scrubTween.duration(value) : scrubTween = gsap3.to(animation, {
            ease: "expo",
            totalProgress: "+=0",
            inherit: false,
            duration: scrubSmooth,
            paused: true,
            onComplete: function onComplete() {
              return onScrubComplete && onScrubComplete(self);
            }
          });
        }
      };
      if (animation) {
        animation.vars.lazy = false;
        animation._initted && !self.isReverted || animation.vars.immediateRender !== false && vars.immediateRender !== false && animation.duration() && animation.render(0, true, true);
        self.animation = animation.pause();
        animation.scrollTrigger = self;
        self.scrubDuration(scrub);
        snap1 = 0;
        id || (id = animation.vars.id);
      }
      if (snap) {
        if (!_isObject(snap) || snap.push) {
          snap = {
            snapTo: snap
          };
        }
        "scrollBehavior" in _body2.style && gsap3.set(isViewport ? [_body2, _docEl2] : scroller, {
          scrollBehavior: "auto"
        });
        _scrollers.forEach(function(o2) {
          return _isFunction(o2) && o2.target === (isViewport ? _doc2.scrollingElement || _docEl2 : scroller) && (o2.smooth = false);
        });
        snapFunc = _isFunction(snap.snapTo) ? snap.snapTo : snap.snapTo === "labels" ? _getClosestLabel(animation) : snap.snapTo === "labelsDirectional" ? _getLabelAtDirection(animation) : snap.directional !== false ? function(value, st) {
          return _snapDirectional(snap.snapTo)(value, _getTime2() - lastRefresh < 500 ? 0 : st.direction);
        } : gsap3.utils.snap(snap.snapTo);
        snapDurClamp = snap.duration || {
          min: 0.1,
          max: 2
        };
        snapDurClamp = _isObject(snapDurClamp) ? _clamp2(snapDurClamp.min, snapDurClamp.max) : _clamp2(snapDurClamp, snapDurClamp);
        snapDelayedCall = gsap3.delayedCall(snap.delay || scrubSmooth / 2 || 0.1, function() {
          var scroll = scrollFunc(), refreshedRecently = _getTime2() - lastRefresh < 500, tween = tweenTo.tween;
          if ((refreshedRecently || Math.abs(self.getVelocity()) < 10) && !tween && !_pointerIsDown && lastSnap !== scroll) {
            var progress = (scroll - start) / change, totalProgress = animation && !isToggle ? animation.totalProgress() : progress, velocity = refreshedRecently ? 0 : (totalProgress - snap2) / (_getTime2() - _time2) * 1e3 || 0, change1 = gsap3.utils.clamp(-progress, 1 - progress, _abs(velocity / 2) * velocity / 0.185), naturalEnd = progress + (snap.inertia === false ? 0 : change1), endValue, endScroll, _snap = snap, onStart = _snap.onStart, _onInterrupt = _snap.onInterrupt, _onComplete = _snap.onComplete;
            endValue = snapFunc(naturalEnd, self);
            _isNumber(endValue) || (endValue = naturalEnd);
            endScroll = Math.max(0, Math.round(start + endValue * change));
            if (scroll <= end && scroll >= start && endScroll !== scroll) {
              if (tween && !tween._initted && tween.data <= _abs(endScroll - scroll)) {
                return;
              }
              if (snap.inertia === false) {
                change1 = endValue - progress;
              }
              tweenTo(endScroll, {
                duration: snapDurClamp(_abs(Math.max(_abs(naturalEnd - totalProgress), _abs(endValue - totalProgress)) * 0.185 / velocity / 0.05 || 0)),
                ease: snap.ease || "power3",
                data: _abs(endScroll - scroll),
                // record the distance so that if another snap tween occurs (conflict) we can prioritize the closest snap.
                onInterrupt: function onInterrupt() {
                  return snapDelayedCall.restart(true) && _onInterrupt && _onInterrupt(self);
                },
                onComplete: function onComplete() {
                  self.update();
                  lastSnap = scrollFunc();
                  if (animation && !isToggle) {
                    scrubTween ? scrubTween.resetTo("totalProgress", endValue, animation._tTime / animation._tDur) : animation.progress(endValue);
                  }
                  snap1 = snap2 = animation && !isToggle ? animation.totalProgress() : self.progress;
                  onSnapComplete && onSnapComplete(self);
                  _onComplete && _onComplete(self);
                }
              }, scroll, change1 * change, endScroll - scroll - change1 * change);
              onStart && onStart(self, tweenTo.tween);
            }
          } else if (self.isActive && lastSnap !== scroll) {
            snapDelayedCall.restart(true);
          }
        }).pause();
      }
      id && (_ids[id] = self);
      trigger = self.trigger = _getTarget(trigger || pin !== true && pin);
      customRevertReturn = trigger && trigger._gsap && trigger._gsap.stRevert;
      customRevertReturn && (customRevertReturn = customRevertReturn(self));
      pin = pin === true ? trigger : _getTarget(pin);
      _isString(toggleClass) && (toggleClass = {
        targets: trigger,
        className: toggleClass
      });
      if (pin) {
        pinSpacing === false || pinSpacing === _margin || (pinSpacing = !pinSpacing && pin.parentNode && pin.parentNode.style && _getComputedStyle(pin.parentNode).display === "flex" ? false : _padding);
        self.pin = pin;
        pinCache = gsap3.core.getCache(pin);
        if (!pinCache.spacer) {
          if (pinSpacer) {
            pinSpacer = _getTarget(pinSpacer);
            pinSpacer && !pinSpacer.nodeType && (pinSpacer = pinSpacer.current || pinSpacer.nativeElement);
            pinCache.spacerIsNative = !!pinSpacer;
            pinSpacer && (pinCache.spacerState = _getState(pinSpacer));
          }
          pinCache.spacer = spacer = pinSpacer || _doc2.createElement("div");
          spacer.classList.add("pin-spacer");
          id && spacer.classList.add("pin-spacer-" + id);
          pinCache.pinState = pinOriginalState = _getState(pin);
        } else {
          pinOriginalState = pinCache.pinState;
        }
        vars.force3D !== false && gsap3.set(pin, {
          force3D: true
        });
        self.spacer = spacer = pinCache.spacer;
        cs = _getComputedStyle(pin);
        spacingStart = cs[pinSpacing + direction.os2];
        pinGetter = gsap3.getProperty(pin);
        pinSetter = gsap3.quickSetter(pin, direction.a, _px);
        _swapPinIn(pin, spacer, cs);
        pinState = _getState(pin);
      }
      if (markers) {
        markerVars = _isObject(markers) ? _setDefaults(markers, _markerDefaults) : _markerDefaults;
        markerStartTrigger = _createMarker("scroller-start", id, scroller, direction, markerVars, 0);
        markerEndTrigger = _createMarker("scroller-end", id, scroller, direction, markerVars, 0, markerStartTrigger);
        offset = markerStartTrigger["offset" + direction.op.d2];
        var content = _getTarget(_getProxyProp(scroller, "content") || scroller);
        markerStart = this.markerStart = _createMarker("start", id, content, direction, markerVars, offset, 0, containerAnimation);
        markerEnd = this.markerEnd = _createMarker("end", id, content, direction, markerVars, offset, 0, containerAnimation);
        containerAnimation && (caMarkerSetter = gsap3.quickSetter([markerStart, markerEnd], direction.a, _px));
        if (!useFixedPosition && !(_proxies.length && _getProxyProp(scroller, "fixedMarkers") === true)) {
          _makePositionable(isViewport ? _body2 : scroller);
          gsap3.set([markerStartTrigger, markerEndTrigger], {
            force3D: true
          });
          markerStartSetter = gsap3.quickSetter(markerStartTrigger, direction.a, _px);
          markerEndSetter = gsap3.quickSetter(markerEndTrigger, direction.a, _px);
        }
      }
      if (containerAnimation) {
        var oldOnUpdate = containerAnimation.vars.onUpdate, oldParams = containerAnimation.vars.onUpdateParams;
        containerAnimation.eventCallback("onUpdate", function() {
          self.update(0, 0, 1);
          oldOnUpdate && oldOnUpdate.apply(containerAnimation, oldParams || []);
        });
      }
      self.previous = function() {
        return _triggers[_triggers.indexOf(self) - 1];
      };
      self.next = function() {
        return _triggers[_triggers.indexOf(self) + 1];
      };
      self.revert = function(revert, temp) {
        if (!temp) {
          return self.kill(true);
        }
        var r2 = revert !== false || !self.enabled, prevRefreshing = _refreshing;
        if (r2 !== self.isReverted) {
          if (r2) {
            prevScroll = Math.max(scrollFunc(), self.scroll.rec || 0);
            prevProgress = self.progress;
            prevAnimProgress = animation && animation.progress();
          }
          markerStart && [markerStart, markerEnd, markerStartTrigger, markerEndTrigger].forEach(function(m) {
            return m.style.display = r2 ? "none" : "block";
          });
          if (r2) {
            _refreshing = self;
            self.update(r2);
          }
          if (pin && (!pinReparent || !self.isActive)) {
            if (r2) {
              _swapPinOut(pin, spacer, pinOriginalState);
            } else {
              _swapPinIn(pin, spacer, _getComputedStyle(pin), spacerState);
            }
          }
          r2 || self.update(r2);
          _refreshing = prevRefreshing;
          self.isReverted = r2;
        }
      };
      self.refresh = function(soft, force, position, pinOffset) {
        if ((_refreshing || !self.enabled) && !force) {
          return;
        }
        if (pin && soft && _lastScrollTime) {
          _addListener3(ScrollTrigger3, "scrollEnd", _softRefresh);
          return;
        }
        !_refreshingAll && onRefreshInit && onRefreshInit(self);
        _refreshing = self;
        if (tweenTo.tween && !position) {
          tweenTo.tween.kill();
          tweenTo.tween = 0;
        }
        scrubTween && scrubTween.pause();
        if (invalidateOnRefresh && animation) {
          animation.revert({
            kill: false
          }).invalidate();
          animation.getChildren && animation.getChildren(true, true, false).forEach(function(t2) {
            return t2.vars.immediateRender && t2.render(0, true, true);
          });
        }
        self.isReverted || self.revert(true, true);
        self._subPinOffset = false;
        var size = getScrollerSize(), scrollerBounds = getScrollerOffsets(), max = containerAnimation ? containerAnimation.duration() : _maxScroll(scroller, direction), isFirstRefresh = change <= 0.01 || !change, offset2 = 0, otherPinOffset = pinOffset || 0, parsedEnd = _isObject(position) ? position.end : vars.end, parsedEndTrigger = vars.endTrigger || trigger, parsedStart = _isObject(position) ? position.start : vars.start || (vars.start === 0 || !trigger ? 0 : pin ? "0 0" : "0 100%"), pinnedContainer = self.pinnedContainer = vars.pinnedContainer && _getTarget(vars.pinnedContainer, self), triggerIndex = trigger && Math.max(0, _triggers.indexOf(self)) || 0, i2 = triggerIndex, cs2, bounds, scroll, isVertical, override, curTrigger, curPin, oppositeScroll, initted, revertedPins, forcedOverflow, markerStartOffset, markerEndOffset;
        if (markers && _isObject(position)) {
          markerStartOffset = gsap3.getProperty(markerStartTrigger, direction.p);
          markerEndOffset = gsap3.getProperty(markerEndTrigger, direction.p);
        }
        while (i2-- > 0) {
          curTrigger = _triggers[i2];
          curTrigger.end || curTrigger.refresh(0, 1) || (_refreshing = self);
          curPin = curTrigger.pin;
          if (curPin && (curPin === trigger || curPin === pin || curPin === pinnedContainer) && !curTrigger.isReverted) {
            revertedPins || (revertedPins = []);
            revertedPins.unshift(curTrigger);
            curTrigger.revert(true, true);
          }
          if (curTrigger !== _triggers[i2]) {
            triggerIndex--;
            i2--;
          }
        }
        _isFunction(parsedStart) && (parsedStart = parsedStart(self));
        parsedStart = _parseClamp(parsedStart, "start", self);
        start = _parsePosition(parsedStart, trigger, size, direction, scrollFunc(), markerStart, markerStartTrigger, self, scrollerBounds, borderWidth, useFixedPosition, max, containerAnimation, self._startClamp && "_startClamp") || (pin ? -1e-3 : 0);
        _isFunction(parsedEnd) && (parsedEnd = parsedEnd(self));
        if (_isString(parsedEnd) && !parsedEnd.indexOf("+=")) {
          if (~parsedEnd.indexOf(" ")) {
            parsedEnd = (_isString(parsedStart) ? parsedStart.split(" ")[0] : "") + parsedEnd;
          } else {
            offset2 = _offsetToPx(parsedEnd.substr(2), size);
            parsedEnd = _isString(parsedStart) ? parsedStart : (containerAnimation ? gsap3.utils.mapRange(0, containerAnimation.duration(), containerAnimation.scrollTrigger.start, containerAnimation.scrollTrigger.end, start) : start) + offset2;
            parsedEndTrigger = trigger;
          }
        }
        parsedEnd = _parseClamp(parsedEnd, "end", self);
        end = Math.max(start, _parsePosition(parsedEnd || (parsedEndTrigger ? "100% 0" : max), parsedEndTrigger, size, direction, scrollFunc() + offset2, markerEnd, markerEndTrigger, self, scrollerBounds, borderWidth, useFixedPosition, max, containerAnimation, self._endClamp && "_endClamp")) || -1e-3;
        offset2 = 0;
        i2 = triggerIndex;
        while (i2--) {
          curTrigger = _triggers[i2];
          curPin = curTrigger.pin;
          if (curPin && curTrigger.start - curTrigger._pinPush <= start && !containerAnimation && curTrigger.end > 0) {
            cs2 = curTrigger.end - (self._startClamp ? Math.max(0, curTrigger.start) : curTrigger.start);
            if ((curPin === trigger && curTrigger.start - curTrigger._pinPush < start || curPin === pinnedContainer) && isNaN(parsedStart)) {
              offset2 += cs2 * (1 - curTrigger.progress);
            }
            curPin === pin && (otherPinOffset += cs2);
          }
        }
        start += offset2;
        end += offset2;
        self._startClamp && (self._startClamp += offset2);
        if (self._endClamp && !_refreshingAll) {
          self._endClamp = end || -1e-3;
          end = Math.min(end, _maxScroll(scroller, direction));
        }
        change = end - start || (start -= 0.01) && 1e-3;
        if (isFirstRefresh) {
          prevProgress = gsap3.utils.clamp(0, 1, gsap3.utils.normalize(start, end, prevScroll));
        }
        self._pinPush = otherPinOffset;
        if (markerStart && offset2) {
          cs2 = {};
          cs2[direction.a] = "+=" + offset2;
          pinnedContainer && (cs2[direction.p] = "-=" + scrollFunc());
          gsap3.set([markerStart, markerEnd], cs2);
        }
        if (pin && !(_clampingMax && self.end >= _maxScroll(scroller, direction))) {
          cs2 = _getComputedStyle(pin);
          isVertical = direction === _vertical;
          scroll = scrollFunc();
          pinStart = parseFloat(pinGetter(direction.a)) + otherPinOffset;
          if (!max && end > 1) {
            forcedOverflow = (isViewport ? _doc2.scrollingElement || _docEl2 : scroller).style;
            forcedOverflow = {
              style: forcedOverflow,
              value: forcedOverflow["overflow" + direction.a.toUpperCase()]
            };
            if (isViewport && _getComputedStyle(_body2)["overflow" + direction.a.toUpperCase()] !== "scroll") {
              forcedOverflow.style["overflow" + direction.a.toUpperCase()] = "scroll";
            }
          }
          _swapPinIn(pin, spacer, cs2);
          pinState = _getState(pin);
          bounds = _getBounds(pin, true);
          oppositeScroll = useFixedPosition && _getScrollFunc(scroller, isVertical ? _horizontal : _vertical)();
          if (pinSpacing) {
            spacerState = [pinSpacing + direction.os2, change + otherPinOffset + _px];
            spacerState.t = spacer;
            i2 = pinSpacing === _padding ? _getSize(pin, direction) + change + otherPinOffset : 0;
            if (i2) {
              spacerState.push(direction.d, i2 + _px);
              spacer.style.flexBasis !== "auto" && (spacer.style.flexBasis = i2 + _px);
            }
            _setState(spacerState);
            if (pinnedContainer) {
              _triggers.forEach(function(t2) {
                if (t2.pin === pinnedContainer && t2.vars.pinSpacing !== false) {
                  t2._subPinOffset = true;
                }
              });
            }
            useFixedPosition && scrollFunc(prevScroll);
          } else {
            i2 = _getSize(pin, direction);
            i2 && spacer.style.flexBasis !== "auto" && (spacer.style.flexBasis = i2 + _px);
          }
          if (useFixedPosition) {
            override = {
              top: bounds.top + (isVertical ? scroll - start : oppositeScroll) + _px,
              left: bounds.left + (isVertical ? oppositeScroll : scroll - start) + _px,
              boxSizing: "border-box",
              position: "fixed"
            };
            override[_width] = override["max" + _Width] = Math.ceil(bounds.width) + _px;
            override[_height] = override["max" + _Height] = Math.ceil(bounds.height) + _px;
            override[_margin] = override[_margin + _Top] = override[_margin + _Right] = override[_margin + _Bottom] = override[_margin + _Left] = "0";
            override[_padding] = cs2[_padding];
            override[_padding + _Top] = cs2[_padding + _Top];
            override[_padding + _Right] = cs2[_padding + _Right];
            override[_padding + _Bottom] = cs2[_padding + _Bottom];
            override[_padding + _Left] = cs2[_padding + _Left];
            pinActiveState = _copyState(pinOriginalState, override, pinReparent);
            _refreshingAll && scrollFunc(0);
          }
          if (animation) {
            initted = animation._initted;
            _suppressOverwrites(1);
            animation.render(animation.duration(), true, true);
            pinChange = pinGetter(direction.a) - pinStart + change + otherPinOffset;
            pinMoves = Math.abs(change - pinChange) > 1;
            useFixedPosition && pinMoves && pinActiveState.splice(pinActiveState.length - 2, 2);
            animation.render(0, true, true);
            initted || animation.invalidate(true);
            animation.parent || animation.totalTime(animation.totalTime());
            _suppressOverwrites(0);
          } else {
            pinChange = change;
          }
          forcedOverflow && (forcedOverflow.value ? forcedOverflow.style["overflow" + direction.a.toUpperCase()] = forcedOverflow.value : forcedOverflow.style.removeProperty("overflow-" + direction.a));
        } else if (trigger && scrollFunc() && !containerAnimation) {
          bounds = trigger.parentNode;
          while (bounds && bounds !== _body2) {
            if (bounds._pinOffset) {
              start -= bounds._pinOffset;
              end -= bounds._pinOffset;
            }
            bounds = bounds.parentNode;
          }
        }
        revertedPins && revertedPins.forEach(function(t2) {
          return t2.revert(false, true);
        });
        self.start = start;
        self.end = end;
        scroll1 = scroll2 = _refreshingAll ? prevScroll : scrollFunc();
        if (!containerAnimation && !_refreshingAll) {
          scroll1 < prevScroll && scrollFunc(prevScroll);
          self.scroll.rec = 0;
        }
        self.revert(false, true);
        lastRefresh = _getTime2();
        if (snapDelayedCall) {
          lastSnap = -1;
          snapDelayedCall.restart(true);
        }
        _refreshing = 0;
        animation && isToggle && (animation._initted || prevAnimProgress) && animation.progress() !== prevAnimProgress && animation.progress(prevAnimProgress || 0, true).render(animation.time(), true, true);
        if (isFirstRefresh || prevProgress !== self.progress || containerAnimation || invalidateOnRefresh || animation && !animation._initted) {
          animation && !isToggle && (animation._initted || prevProgress || animation.vars.immediateRender !== false) && animation.totalProgress(containerAnimation && start < -1e-3 && !prevProgress ? gsap3.utils.normalize(start, end, 0) : prevProgress, true);
          self.progress = isFirstRefresh || (scroll1 - start) / change === prevProgress ? 0 : prevProgress;
        }
        pin && pinSpacing && (spacer._pinOffset = Math.round(self.progress * pinChange));
        scrubTween && scrubTween.invalidate();
        if (!isNaN(markerStartOffset)) {
          markerStartOffset -= gsap3.getProperty(markerStartTrigger, direction.p);
          markerEndOffset -= gsap3.getProperty(markerEndTrigger, direction.p);
          _shiftMarker(markerStartTrigger, direction, markerStartOffset);
          _shiftMarker(markerStart, direction, markerStartOffset - (pinOffset || 0));
          _shiftMarker(markerEndTrigger, direction, markerEndOffset);
          _shiftMarker(markerEnd, direction, markerEndOffset - (pinOffset || 0));
        }
        isFirstRefresh && !_refreshingAll && self.update();
        if (onRefresh && !_refreshingAll && !executingOnRefresh) {
          executingOnRefresh = true;
          onRefresh(self);
          executingOnRefresh = false;
        }
      };
      self.getVelocity = function() {
        return (scrollFunc() - scroll2) / (_getTime2() - _time2) * 1e3 || 0;
      };
      self.endAnimation = function() {
        _endAnimation(self.callbackAnimation);
        if (animation) {
          scrubTween ? scrubTween.progress(1) : !animation.paused() ? _endAnimation(animation, animation.reversed()) : isToggle || _endAnimation(animation, self.direction < 0, 1);
        }
      };
      self.labelToScroll = function(label) {
        return animation && animation.labels && (start || self.refresh() || start) + animation.labels[label] / animation.duration() * change || 0;
      };
      self.getTrailing = function(name) {
        var i2 = _triggers.indexOf(self), a2 = self.direction > 0 ? _triggers.slice(0, i2).reverse() : _triggers.slice(i2 + 1);
        return (_isString(name) ? a2.filter(function(t2) {
          return t2.vars.preventOverlaps === name;
        }) : a2).filter(function(t2) {
          return self.direction > 0 ? t2.end <= start : t2.start >= end;
        });
      };
      self.update = function(reset, recordVelocity, forceFake) {
        if (containerAnimation && !forceFake && !reset) {
          return;
        }
        var scroll = _refreshingAll === true ? prevScroll : self.scroll(), p2 = reset ? 0 : (scroll - start) / change, clipped = p2 < 0 ? 0 : p2 > 1 ? 1 : p2 || 0, prevProgress2 = self.progress, isActive, wasActive, toggleState, action, stateChanged, toggled, isAtMax, isTakingAction;
        if (recordVelocity) {
          scroll2 = scroll1;
          scroll1 = containerAnimation ? scrollFunc() : scroll;
          if (snap) {
            snap2 = snap1;
            snap1 = animation && !isToggle ? animation.totalProgress() : clipped;
          }
        }
        if (anticipatePin && pin && !_refreshing && !_startup2 && _lastScrollTime) {
          if (!clipped && start < scroll + (scroll - scroll2) / (_getTime2() - _time2) * anticipatePin) {
            clipped = 1e-4;
          } else if (clipped === 1 && end > scroll + (scroll - scroll2) / (_getTime2() - _time2) * anticipatePin) {
            clipped = 0.9999;
          }
        }
        if (clipped !== prevProgress2 && self.enabled) {
          isActive = self.isActive = !!clipped && clipped < 1;
          wasActive = !!prevProgress2 && prevProgress2 < 1;
          toggled = isActive !== wasActive;
          stateChanged = toggled || !!clipped !== !!prevProgress2;
          self.direction = clipped > prevProgress2 ? 1 : -1;
          self.progress = clipped;
          if (stateChanged && !_refreshing) {
            toggleState = clipped && !prevProgress2 ? 0 : clipped === 1 ? 1 : prevProgress2 === 1 ? 2 : 3;
            if (isToggle) {
              action = !toggled && toggleActions[toggleState + 1] !== "none" && toggleActions[toggleState + 1] || toggleActions[toggleState];
              isTakingAction = animation && (action === "complete" || action === "reset" || action in animation);
            }
          }
          preventOverlaps && (toggled || isTakingAction) && (isTakingAction || scrub || !animation) && (_isFunction(preventOverlaps) ? preventOverlaps(self) : self.getTrailing(preventOverlaps).forEach(function(t2) {
            return t2.endAnimation();
          }));
          if (!isToggle) {
            if (scrubTween && !_refreshing && !_startup2) {
              scrubTween._dp._time - scrubTween._start !== scrubTween._time && scrubTween.render(scrubTween._dp._time - scrubTween._start);
              if (scrubTween.resetTo) {
                scrubTween.resetTo("totalProgress", clipped, animation._tTime / animation._tDur);
              } else {
                scrubTween.vars.totalProgress = clipped;
                scrubTween.invalidate().restart();
              }
            } else if (animation) {
              animation.totalProgress(clipped, !!(_refreshing && (lastRefresh || reset)));
            }
          }
          if (pin) {
            reset && pinSpacing && (spacer.style[pinSpacing + direction.os2] = spacingStart);
            if (!useFixedPosition) {
              pinSetter(_round(pinStart + pinChange * clipped));
            } else if (stateChanged) {
              isAtMax = !reset && clipped > prevProgress2 && end + 1 > scroll && scroll + 1 >= _maxScroll(scroller, direction);
              if (pinReparent) {
                if (!reset && (isActive || isAtMax)) {
                  var bounds = _getBounds(pin, true), _offset = scroll - start;
                  _reparent(pin, _body2, bounds.top + (direction === _vertical ? _offset : 0) + _px, bounds.left + (direction === _vertical ? 0 : _offset) + _px);
                } else {
                  _reparent(pin, spacer);
                }
              }
              _setState(isActive || isAtMax ? pinActiveState : pinState);
              pinMoves && clipped < 1 && isActive || pinSetter(pinStart + (clipped === 1 && !isAtMax ? pinChange : 0));
            }
          }
          snap && !tweenTo.tween && !_refreshing && !_startup2 && snapDelayedCall.restart(true);
          toggleClass && (toggled || once && clipped && (clipped < 1 || !_limitCallbacks)) && _toArray(toggleClass.targets).forEach(function(el) {
            return el.classList[isActive || once ? "add" : "remove"](toggleClass.className);
          });
          onUpdate && !isToggle && !reset && onUpdate(self);
          if (stateChanged && !_refreshing) {
            if (isToggle) {
              if (isTakingAction) {
                if (action === "complete") {
                  animation.pause().totalProgress(1);
                } else if (action === "reset") {
                  animation.restart(true).pause();
                } else if (action === "restart") {
                  animation.restart(true);
                } else {
                  animation[action]();
                }
              }
              onUpdate && onUpdate(self);
            }
            if (toggled || !_limitCallbacks) {
              onToggle && toggled && _callback(self, onToggle);
              callbacks[toggleState] && _callback(self, callbacks[toggleState]);
              once && (clipped === 1 ? self.kill(false, 1) : callbacks[toggleState] = 0);
              if (!toggled) {
                toggleState = clipped === 1 ? 1 : 3;
                callbacks[toggleState] && _callback(self, callbacks[toggleState]);
              }
            }
            if (fastScrollEnd && !isActive && Math.abs(self.getVelocity()) > (_isNumber(fastScrollEnd) ? fastScrollEnd : 2500)) {
              _endAnimation(self.callbackAnimation);
              scrubTween ? scrubTween.progress(1) : _endAnimation(animation, action === "reverse" ? 1 : !clipped, 1);
            }
          } else if (isToggle && onUpdate && !_refreshing) {
            onUpdate(self);
          }
        }
        if (markerEndSetter) {
          var n2 = containerAnimation ? scroll / containerAnimation.duration() * (containerAnimation._caScrollDist || 0) : scroll;
          markerStartSetter(n2 + (markerStartTrigger._isFlipped ? 1 : 0));
          markerEndSetter(n2);
        }
        caMarkerSetter && caMarkerSetter(-scroll / containerAnimation.duration() * (containerAnimation._caScrollDist || 0));
      };
      self.enable = function(reset, refresh) {
        if (!self.enabled) {
          self.enabled = true;
          _addListener3(scroller, "resize", _onResize);
          isViewport || _addListener3(scroller, "scroll", _onScroll3);
          onRefreshInit && _addListener3(ScrollTrigger3, "refreshInit", onRefreshInit);
          if (reset !== false) {
            self.progress = prevProgress = 0;
            scroll1 = scroll2 = lastSnap = scrollFunc();
          }
          refresh !== false && self.refresh();
        }
      };
      self.getTween = function(snap3) {
        return snap3 && tweenTo ? tweenTo.tween : scrubTween;
      };
      self.setPositions = function(newStart, newEnd, keepClamp, pinOffset) {
        if (containerAnimation) {
          var st = containerAnimation.scrollTrigger, duration = containerAnimation.duration(), _change = st.end - st.start;
          newStart = st.start + _change * newStart / duration;
          newEnd = st.start + _change * newEnd / duration;
        }
        self.refresh(false, false, {
          start: _keepClamp(newStart, keepClamp && !!self._startClamp),
          end: _keepClamp(newEnd, keepClamp && !!self._endClamp)
        }, pinOffset);
        self.update();
      };
      self.adjustPinSpacing = function(amount) {
        if (spacerState && amount) {
          var i2 = spacerState.indexOf(direction.d) + 1;
          spacerState[i2] = parseFloat(spacerState[i2]) + amount + _px;
          spacerState[1] = parseFloat(spacerState[1]) + amount + _px;
          _setState(spacerState);
        }
      };
      self.disable = function(reset, allowAnimation) {
        if (self.enabled) {
          reset !== false && self.revert(true, true);
          self.enabled = self.isActive = false;
          allowAnimation || scrubTween && scrubTween.pause();
          prevScroll = 0;
          pinCache && (pinCache.uncache = 1);
          onRefreshInit && _removeListener3(ScrollTrigger3, "refreshInit", onRefreshInit);
          if (snapDelayedCall) {
            snapDelayedCall.pause();
            tweenTo.tween && tweenTo.tween.kill() && (tweenTo.tween = 0);
          }
          if (!isViewport) {
            var i2 = _triggers.length;
            while (i2--) {
              if (_triggers[i2].scroller === scroller && _triggers[i2] !== self) {
                return;
              }
            }
            _removeListener3(scroller, "resize", _onResize);
            isViewport || _removeListener3(scroller, "scroll", _onScroll3);
          }
        }
      };
      self.kill = function(revert, allowAnimation) {
        self.disable(revert, allowAnimation);
        scrubTween && !allowAnimation && scrubTween.kill();
        id && delete _ids[id];
        var i2 = _triggers.indexOf(self);
        i2 >= 0 && _triggers.splice(i2, 1);
        i2 === _i && _direction > 0 && _i--;
        i2 = 0;
        _triggers.forEach(function(t2) {
          return t2.scroller === self.scroller && (i2 = 1);
        });
        i2 || _refreshingAll || (self.scroll.rec = 0);
        if (animation) {
          animation.scrollTrigger = null;
          revert && animation.revert({
            kill: false
          });
          allowAnimation || animation.kill();
        }
        markerStart && [markerStart, markerEnd, markerStartTrigger, markerEndTrigger].forEach(function(m) {
          return m.parentNode && m.parentNode.removeChild(m);
        });
        _primary === self && (_primary = 0);
        if (pin) {
          pinCache && (pinCache.uncache = 1);
          i2 = 0;
          _triggers.forEach(function(t2) {
            return t2.pin === pin && i2++;
          });
          i2 || (pinCache.spacer = 0);
        }
        vars.onKill && vars.onKill(self);
      };
      _triggers.push(self);
      self.enable(false, false);
      customRevertReturn && customRevertReturn(self);
      if (animation && animation.add && !change) {
        var updateFunc = self.update;
        self.update = function() {
          self.update = updateFunc;
          _scrollers.cache++;
          start || end || self.refresh();
        };
        gsap3.delayedCall(0.01, self.update);
        change = 0.01;
        start = end = 0;
      } else {
        self.refresh();
      }
      pin && _queueRefreshAll();
    };
    ScrollTrigger3.register = function register(core) {
      if (!_coreInitted2) {
        gsap3 = core || _getGSAP3();
        _windowExists() && window.document && ScrollTrigger3.enable();
        _coreInitted2 = _enabled;
      }
      return _coreInitted2;
    };
    ScrollTrigger3.defaults = function defaults(config) {
      if (config) {
        for (var p2 in config) {
          _defaults[p2] = config[p2];
        }
      }
      return _defaults;
    };
    ScrollTrigger3.disable = function disable(reset, kill) {
      _enabled = 0;
      _triggers.forEach(function(trigger) {
        return trigger[kill ? "kill" : "disable"](reset);
      });
      _removeListener3(_win2, "wheel", _onScroll3);
      _removeListener3(_doc2, "scroll", _onScroll3);
      clearInterval(_syncInterval);
      _removeListener3(_doc2, "touchcancel", _passThrough);
      _removeListener3(_body2, "touchstart", _passThrough);
      _multiListener(_removeListener3, _doc2, "pointerdown,touchstart,mousedown", _pointerDownHandler);
      _multiListener(_removeListener3, _doc2, "pointerup,touchend,mouseup", _pointerUpHandler);
      _resizeDelay.kill();
      _iterateAutoRefresh(_removeListener3);
      for (var i2 = 0; i2 < _scrollers.length; i2 += 3) {
        _wheelListener(_removeListener3, _scrollers[i2], _scrollers[i2 + 1]);
        _wheelListener(_removeListener3, _scrollers[i2], _scrollers[i2 + 2]);
      }
    };
    ScrollTrigger3.enable = function enable() {
      _win2 = window;
      _doc2 = document;
      _docEl2 = _doc2.documentElement;
      _body2 = _doc2.body;
      if (gsap3) {
        _toArray = gsap3.utils.toArray;
        _clamp2 = gsap3.utils.clamp;
        _context2 = gsap3.core.context || _passThrough;
        _suppressOverwrites = gsap3.core.suppressOverwrites || _passThrough;
        _scrollRestoration = _win2.history.scrollRestoration || "auto";
        _lastScroll = _win2.pageYOffset || 0;
        gsap3.core.globals("ScrollTrigger", ScrollTrigger3);
        if (_body2) {
          _enabled = 1;
          _div100vh = document.createElement("div");
          _div100vh.style.height = "100vh";
          _div100vh.style.position = "absolute";
          _refresh100vh();
          _rafBugFix();
          Observer.register(gsap3);
          ScrollTrigger3.isTouch = Observer.isTouch;
          _fixIOSBug = Observer.isTouch && /(iPad|iPhone|iPod|Mac)/g.test(navigator.userAgent);
          _ignoreMobileResize = Observer.isTouch === 1;
          _addListener3(_win2, "wheel", _onScroll3);
          _root2 = [_win2, _doc2, _docEl2, _body2];
          if (gsap3.matchMedia) {
            ScrollTrigger3.matchMedia = function(vars) {
              var mm = gsap3.matchMedia(), p2;
              for (p2 in vars) {
                mm.add(p2, vars[p2]);
              }
              return mm;
            };
            gsap3.addEventListener("matchMediaInit", function() {
              return _revertAll();
            });
            gsap3.addEventListener("matchMediaRevert", function() {
              return _revertRecorded();
            });
            gsap3.addEventListener("matchMedia", function() {
              _refreshAll(0, 1);
              _dispatch("matchMedia");
            });
            gsap3.matchMedia().add("(orientation: portrait)", function() {
              _setBaseDimensions();
              return _setBaseDimensions;
            });
          } else {
            console.warn("Requires GSAP 3.11.0 or later");
          }
          _setBaseDimensions();
          _addListener3(_doc2, "scroll", _onScroll3);
          var bodyHasStyle = _body2.hasAttribute("style"), bodyStyle = _body2.style, border = bodyStyle.borderTopStyle, AnimationProto = gsap3.core.Animation.prototype, bounds, i2;
          AnimationProto.revert || Object.defineProperty(AnimationProto, "revert", {
            value: function value() {
              return this.time(-0.01, true);
            }
          });
          bodyStyle.borderTopStyle = "solid";
          bounds = _getBounds(_body2);
          _vertical.m = Math.round(bounds.top + _vertical.sc()) || 0;
          _horizontal.m = Math.round(bounds.left + _horizontal.sc()) || 0;
          border ? bodyStyle.borderTopStyle = border : bodyStyle.removeProperty("border-top-style");
          if (!bodyHasStyle) {
            _body2.setAttribute("style", "");
            _body2.removeAttribute("style");
          }
          _syncInterval = setInterval(_sync, 250);
          gsap3.delayedCall(0.5, function() {
            return _startup2 = 0;
          });
          _addListener3(_doc2, "touchcancel", _passThrough);
          _addListener3(_body2, "touchstart", _passThrough);
          _multiListener(_addListener3, _doc2, "pointerdown,touchstart,mousedown", _pointerDownHandler);
          _multiListener(_addListener3, _doc2, "pointerup,touchend,mouseup", _pointerUpHandler);
          _transformProp = gsap3.utils.checkPrefix("transform");
          _stateProps.push(_transformProp);
          _coreInitted2 = _getTime2();
          _resizeDelay = gsap3.delayedCall(0.2, _refreshAll).pause();
          _autoRefresh = [_doc2, "visibilitychange", function() {
            var w = _win2.innerWidth, h2 = _win2.innerHeight;
            if (_doc2.hidden) {
              _prevWidth = w;
              _prevHeight = h2;
            } else if (_prevWidth !== w || _prevHeight !== h2) {
              _onResize();
            }
          }, _doc2, "DOMContentLoaded", _refreshAll, _win2, "load", _refreshAll, _win2, "resize", _onResize];
          _iterateAutoRefresh(_addListener3);
          _triggers.forEach(function(trigger) {
            return trigger.enable(0, 1);
          });
          for (i2 = 0; i2 < _scrollers.length; i2 += 3) {
            _wheelListener(_removeListener3, _scrollers[i2], _scrollers[i2 + 1]);
            _wheelListener(_removeListener3, _scrollers[i2], _scrollers[i2 + 2]);
          }
        }
      }
    };
    ScrollTrigger3.config = function config(vars) {
      "limitCallbacks" in vars && (_limitCallbacks = !!vars.limitCallbacks);
      var ms = vars.syncInterval;
      ms && clearInterval(_syncInterval) || (_syncInterval = ms) && setInterval(_sync, ms);
      "ignoreMobileResize" in vars && (_ignoreMobileResize = ScrollTrigger3.isTouch === 1 && vars.ignoreMobileResize);
      if ("autoRefreshEvents" in vars) {
        _iterateAutoRefresh(_removeListener3) || _iterateAutoRefresh(_addListener3, vars.autoRefreshEvents || "none");
        _ignoreResize = (vars.autoRefreshEvents + "").indexOf("resize") === -1;
      }
    };
    ScrollTrigger3.scrollerProxy = function scrollerProxy(target, vars) {
      var t2 = _getTarget(target), i2 = _scrollers.indexOf(t2), isViewport = _isViewport3(t2);
      if (~i2) {
        _scrollers.splice(i2, isViewport ? 6 : 2);
      }
      if (vars) {
        isViewport ? _proxies.unshift(_win2, vars, _body2, vars, _docEl2, vars) : _proxies.unshift(t2, vars);
      }
    };
    ScrollTrigger3.clearMatchMedia = function clearMatchMedia(query) {
      _triggers.forEach(function(t2) {
        return t2._ctx && t2._ctx.query === query && t2._ctx.kill(true, true);
      });
    };
    ScrollTrigger3.isInViewport = function isInViewport(element, ratio, horizontal) {
      var bounds = (_isString(element) ? _getTarget(element) : element).getBoundingClientRect(), offset = bounds[horizontal ? _width : _height] * ratio || 0;
      return horizontal ? bounds.right - offset > 0 && bounds.left + offset < _win2.innerWidth : bounds.bottom - offset > 0 && bounds.top + offset < _win2.innerHeight;
    };
    ScrollTrigger3.positionInViewport = function positionInViewport(element, referencePoint, horizontal) {
      _isString(element) && (element = _getTarget(element));
      var bounds = element.getBoundingClientRect(), size = bounds[horizontal ? _width : _height], offset = referencePoint == null ? size / 2 : referencePoint in _keywords ? _keywords[referencePoint] * size : ~referencePoint.indexOf("%") ? parseFloat(referencePoint) * size / 100 : parseFloat(referencePoint) || 0;
      return horizontal ? (bounds.left + offset) / _win2.innerWidth : (bounds.top + offset) / _win2.innerHeight;
    };
    ScrollTrigger3.killAll = function killAll(allowListeners) {
      _triggers.slice(0).forEach(function(t2) {
        return t2.vars.id !== "ScrollSmoother" && t2.kill();
      });
      if (allowListeners !== true) {
        var listeners = _listeners.killAll || [];
        _listeners = {};
        listeners.forEach(function(f2) {
          return f2();
        });
      }
    };
    return ScrollTrigger3;
  }();
  ScrollTrigger2.version = "3.13.0";
  ScrollTrigger2.saveStyles = function(targets) {
    return targets ? _toArray(targets).forEach(function(target) {
      if (target && target.style) {
        var i2 = _savedStyles.indexOf(target);
        i2 >= 0 && _savedStyles.splice(i2, 5);
        _savedStyles.push(target, target.style.cssText, target.getBBox && target.getAttribute("transform"), gsap3.core.getCache(target), _context2());
      }
    }) : _savedStyles;
  };
  ScrollTrigger2.revert = function(soft, media) {
    return _revertAll(!soft, media);
  };
  ScrollTrigger2.create = function(vars, animation) {
    return new ScrollTrigger2(vars, animation);
  };
  ScrollTrigger2.refresh = function(safe) {
    return safe ? _onResize(true) : (_coreInitted2 || ScrollTrigger2.register()) && _refreshAll(true);
  };
  ScrollTrigger2.update = function(force) {
    return ++_scrollers.cache && _updateAll(force === true ? 2 : 0);
  };
  ScrollTrigger2.clearScrollMemory = _clearScrollMemory;
  ScrollTrigger2.maxScroll = function(element, horizontal) {
    return _maxScroll(element, horizontal ? _horizontal : _vertical);
  };
  ScrollTrigger2.getScrollFunc = function(element, horizontal) {
    return _getScrollFunc(_getTarget(element), horizontal ? _horizontal : _vertical);
  };
  ScrollTrigger2.getById = function(id) {
    return _ids[id];
  };
  ScrollTrigger2.getAll = function() {
    return _triggers.filter(function(t2) {
      return t2.vars.id !== "ScrollSmoother";
    });
  };
  ScrollTrigger2.isScrolling = function() {
    return !!_lastScrollTime;
  };
  ScrollTrigger2.snapDirectional = _snapDirectional;
  ScrollTrigger2.addEventListener = function(type, callback) {
    var a2 = _listeners[type] || (_listeners[type] = []);
    ~a2.indexOf(callback) || a2.push(callback);
  };
  ScrollTrigger2.removeEventListener = function(type, callback) {
    var a2 = _listeners[type], i2 = a2 && a2.indexOf(callback);
    i2 >= 0 && a2.splice(i2, 1);
  };
  ScrollTrigger2.batch = function(targets, vars) {
    var result = [], varsCopy = {}, interval = vars.interval || 0.016, batchMax = vars.batchMax || 1e9, proxyCallback = function proxyCallback2(type, callback) {
      var elements = [], triggers = [], delay = gsap3.delayedCall(interval, function() {
        callback(elements, triggers);
        elements = [];
        triggers = [];
      }).pause();
      return function(self) {
        elements.length || delay.restart(true);
        elements.push(self.trigger);
        triggers.push(self);
        batchMax <= elements.length && delay.progress(1);
      };
    }, p2;
    for (p2 in vars) {
      varsCopy[p2] = p2.substr(0, 2) === "on" && _isFunction(vars[p2]) && p2 !== "onRefreshInit" ? proxyCallback(p2, vars[p2]) : vars[p2];
    }
    if (_isFunction(batchMax)) {
      batchMax = batchMax();
      _addListener3(ScrollTrigger2, "refresh", function() {
        return batchMax = vars.batchMax();
      });
    }
    _toArray(targets).forEach(function(target) {
      var config = {};
      for (p2 in varsCopy) {
        config[p2] = varsCopy[p2];
      }
      config.trigger = target;
      result.push(ScrollTrigger2.create(config));
    });
    return result;
  };
  var _clampScrollAndGetDurationMultiplier = function _clampScrollAndGetDurationMultiplier2(scrollFunc, current, end, max) {
    current > max ? scrollFunc(max) : current < 0 && scrollFunc(0);
    return end > max ? (max - current) / (end - current) : end < 0 ? current / (current - end) : 1;
  };
  var _allowNativePanning = function _allowNativePanning2(target, direction) {
    if (direction === true) {
      target.style.removeProperty("touch-action");
    } else {
      target.style.touchAction = direction === true ? "auto" : direction ? "pan-" + direction + (Observer.isTouch ? " pinch-zoom" : "") : "none";
    }
    target === _docEl2 && _allowNativePanning2(_body2, direction);
  };
  var _overflow = {
    auto: 1,
    scroll: 1
  };
  var _nestedScroll = function _nestedScroll2(_ref5) {
    var event = _ref5.event, target = _ref5.target, axis = _ref5.axis;
    var node = (event.changedTouches ? event.changedTouches[0] : event).target, cache = node._gsap || gsap3.core.getCache(node), time = _getTime2(), cs;
    if (!cache._isScrollT || time - cache._isScrollT > 2e3) {
      while (node && node !== _body2 && (node.scrollHeight <= node.clientHeight && node.scrollWidth <= node.clientWidth || !(_overflow[(cs = _getComputedStyle(node)).overflowY] || _overflow[cs.overflowX]))) {
        node = node.parentNode;
      }
      cache._isScroll = node && node !== target && !_isViewport3(node) && (_overflow[(cs = _getComputedStyle(node)).overflowY] || _overflow[cs.overflowX]);
      cache._isScrollT = time;
    }
    if (cache._isScroll || axis === "x") {
      event.stopPropagation();
      event._gsapAllow = true;
    }
  };
  var _inputObserver = function _inputObserver2(target, type, inputs, nested) {
    return Observer.create({
      target,
      capture: true,
      debounce: false,
      lockAxis: true,
      type,
      onWheel: nested = nested && _nestedScroll,
      onPress: nested,
      onDrag: nested,
      onScroll: nested,
      onEnable: function onEnable() {
        return inputs && _addListener3(_doc2, Observer.eventTypes[0], _captureInputs, false, true);
      },
      onDisable: function onDisable() {
        return _removeListener3(_doc2, Observer.eventTypes[0], _captureInputs, true);
      }
    });
  };
  var _inputExp = /(input|label|select|textarea)/i;
  var _inputIsFocused;
  var _captureInputs = function _captureInputs2(e2) {
    var isInput = _inputExp.test(e2.target.tagName);
    if (isInput || _inputIsFocused) {
      e2._gsapAllow = true;
      _inputIsFocused = isInput;
    }
  };
  var _getScrollNormalizer = function _getScrollNormalizer2(vars) {
    _isObject(vars) || (vars = {});
    vars.preventDefault = vars.isNormalizer = vars.allowClicks = true;
    vars.type || (vars.type = "wheel,touch");
    vars.debounce = !!vars.debounce;
    vars.id = vars.id || "normalizer";
    var _vars2 = vars, normalizeScrollX = _vars2.normalizeScrollX, momentum = _vars2.momentum, allowNestedScroll = _vars2.allowNestedScroll, onRelease = _vars2.onRelease, self, maxY, target = _getTarget(vars.target) || _docEl2, smoother = gsap3.core.globals().ScrollSmoother, smootherInstance = smoother && smoother.get(), content = _fixIOSBug && (vars.content && _getTarget(vars.content) || smootherInstance && vars.content !== false && !smootherInstance.smooth() && smootherInstance.content()), scrollFuncY = _getScrollFunc(target, _vertical), scrollFuncX = _getScrollFunc(target, _horizontal), scale = 1, initialScale = (Observer.isTouch && _win2.visualViewport ? _win2.visualViewport.scale * _win2.visualViewport.width : _win2.outerWidth) / _win2.innerWidth, wheelRefresh = 0, resolveMomentumDuration = _isFunction(momentum) ? function() {
      return momentum(self);
    } : function() {
      return momentum || 2.8;
    }, lastRefreshID, skipTouchMove, inputObserver = _inputObserver(target, vars.type, true, allowNestedScroll), resumeTouchMove = function resumeTouchMove2() {
      return skipTouchMove = false;
    }, scrollClampX = _passThrough, scrollClampY = _passThrough, updateClamps = function updateClamps2() {
      maxY = _maxScroll(target, _vertical);
      scrollClampY = _clamp2(_fixIOSBug ? 1 : 0, maxY);
      normalizeScrollX && (scrollClampX = _clamp2(0, _maxScroll(target, _horizontal)));
      lastRefreshID = _refreshID;
    }, removeContentOffset = function removeContentOffset2() {
      content._gsap.y = _round(parseFloat(content._gsap.y) + scrollFuncY.offset) + "px";
      content.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + parseFloat(content._gsap.y) + ", 0, 1)";
      scrollFuncY.offset = scrollFuncY.cacheID = 0;
    }, ignoreDrag = function ignoreDrag2() {
      if (skipTouchMove) {
        requestAnimationFrame(resumeTouchMove);
        var offset = _round(self.deltaY / 2), scroll = scrollClampY(scrollFuncY.v - offset);
        if (content && scroll !== scrollFuncY.v + scrollFuncY.offset) {
          scrollFuncY.offset = scroll - scrollFuncY.v;
          var y = _round((parseFloat(content && content._gsap.y) || 0) - scrollFuncY.offset);
          content.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + y + ", 0, 1)";
          content._gsap.y = y + "px";
          scrollFuncY.cacheID = _scrollers.cache;
          _updateAll();
        }
        return true;
      }
      scrollFuncY.offset && removeContentOffset();
      skipTouchMove = true;
    }, tween, startScrollX, startScrollY, onStopDelayedCall, onResize = function onResize2() {
      updateClamps();
      if (tween.isActive() && tween.vars.scrollY > maxY) {
        scrollFuncY() > maxY ? tween.progress(1) && scrollFuncY(maxY) : tween.resetTo("scrollY", maxY);
      }
    };
    content && gsap3.set(content, {
      y: "+=0"
    });
    vars.ignoreCheck = function(e2) {
      return _fixIOSBug && e2.type === "touchmove" && ignoreDrag(e2) || scale > 1.05 && e2.type !== "touchstart" || self.isGesturing || e2.touches && e2.touches.length > 1;
    };
    vars.onPress = function() {
      skipTouchMove = false;
      var prevScale = scale;
      scale = _round((_win2.visualViewport && _win2.visualViewport.scale || 1) / initialScale);
      tween.pause();
      prevScale !== scale && _allowNativePanning(target, scale > 1.01 ? true : normalizeScrollX ? false : "x");
      startScrollX = scrollFuncX();
      startScrollY = scrollFuncY();
      updateClamps();
      lastRefreshID = _refreshID;
    };
    vars.onRelease = vars.onGestureStart = function(self2, wasDragging) {
      scrollFuncY.offset && removeContentOffset();
      if (!wasDragging) {
        onStopDelayedCall.restart(true);
      } else {
        _scrollers.cache++;
        var dur = resolveMomentumDuration(), currentScroll, endScroll;
        if (normalizeScrollX) {
          currentScroll = scrollFuncX();
          endScroll = currentScroll + dur * 0.05 * -self2.velocityX / 0.227;
          dur *= _clampScrollAndGetDurationMultiplier(scrollFuncX, currentScroll, endScroll, _maxScroll(target, _horizontal));
          tween.vars.scrollX = scrollClampX(endScroll);
        }
        currentScroll = scrollFuncY();
        endScroll = currentScroll + dur * 0.05 * -self2.velocityY / 0.227;
        dur *= _clampScrollAndGetDurationMultiplier(scrollFuncY, currentScroll, endScroll, _maxScroll(target, _vertical));
        tween.vars.scrollY = scrollClampY(endScroll);
        tween.invalidate().duration(dur).play(0.01);
        if (_fixIOSBug && tween.vars.scrollY >= maxY || currentScroll >= maxY - 1) {
          gsap3.to({}, {
            onUpdate: onResize,
            duration: dur
          });
        }
      }
      onRelease && onRelease(self2);
    };
    vars.onWheel = function() {
      tween._ts && tween.pause();
      if (_getTime2() - wheelRefresh > 1e3) {
        lastRefreshID = 0;
        wheelRefresh = _getTime2();
      }
    };
    vars.onChange = function(self2, dx, dy, xArray, yArray) {
      _refreshID !== lastRefreshID && updateClamps();
      dx && normalizeScrollX && scrollFuncX(scrollClampX(xArray[2] === dx ? startScrollX + (self2.startX - self2.x) : scrollFuncX() + dx - xArray[1]));
      if (dy) {
        scrollFuncY.offset && removeContentOffset();
        var isTouch = yArray[2] === dy, y = isTouch ? startScrollY + self2.startY - self2.y : scrollFuncY() + dy - yArray[1], yClamped = scrollClampY(y);
        isTouch && y !== yClamped && (startScrollY += yClamped - y);
        scrollFuncY(yClamped);
      }
      (dy || dx) && _updateAll();
    };
    vars.onEnable = function() {
      _allowNativePanning(target, normalizeScrollX ? false : "x");
      ScrollTrigger2.addEventListener("refresh", onResize);
      _addListener3(_win2, "resize", onResize);
      if (scrollFuncY.smooth) {
        scrollFuncY.target.style.scrollBehavior = "auto";
        scrollFuncY.smooth = scrollFuncX.smooth = false;
      }
      inputObserver.enable();
    };
    vars.onDisable = function() {
      _allowNativePanning(target, true);
      _removeListener3(_win2, "resize", onResize);
      ScrollTrigger2.removeEventListener("refresh", onResize);
      inputObserver.kill();
    };
    vars.lockAxis = vars.lockAxis !== false;
    self = new Observer(vars);
    self.iOS = _fixIOSBug;
    _fixIOSBug && !scrollFuncY() && scrollFuncY(1);
    _fixIOSBug && gsap3.ticker.add(_passThrough);
    onStopDelayedCall = self._dc;
    tween = gsap3.to(self, {
      ease: "power4",
      paused: true,
      inherit: false,
      scrollX: normalizeScrollX ? "+=0.1" : "+=0",
      scrollY: "+=0.1",
      modifiers: {
        scrollY: _interruptionTracker(scrollFuncY, scrollFuncY(), function() {
          return tween.pause();
        })
      },
      onUpdate: _updateAll,
      onComplete: onStopDelayedCall.vars.onComplete
    });
    return self;
  };
  ScrollTrigger2.sort = function(func) {
    if (_isFunction(func)) {
      return _triggers.sort(func);
    }
    var scroll = _win2.pageYOffset || 0;
    ScrollTrigger2.getAll().forEach(function(t2) {
      return t2._sortY = t2.trigger ? scroll + t2.trigger.getBoundingClientRect().top : t2.start + _win2.innerHeight;
    });
    return _triggers.sort(func || function(a2, b) {
      return (a2.vars.refreshPriority || 0) * -1e6 + (a2.vars.containerAnimation ? 1e6 : a2._sortY) - ((b.vars.containerAnimation ? 1e6 : b._sortY) + (b.vars.refreshPriority || 0) * -1e6);
    });
  };
  ScrollTrigger2.observe = function(vars) {
    return new Observer(vars);
  };
  ScrollTrigger2.normalizeScroll = function(vars) {
    if (typeof vars === "undefined") {
      return _normalizer2;
    }
    if (vars === true && _normalizer2) {
      return _normalizer2.enable();
    }
    if (vars === false) {
      _normalizer2 && _normalizer2.kill();
      _normalizer2 = vars;
      return;
    }
    var normalizer = vars instanceof Observer ? vars : _getScrollNormalizer(vars);
    _normalizer2 && _normalizer2.target === normalizer.target && _normalizer2.kill();
    _isViewport3(normalizer.target) && (_normalizer2 = normalizer);
    return normalizer;
  };
  ScrollTrigger2.core = {
    // smaller file size way to leverage in ScrollSmoother and Observer
    _getVelocityProp,
    _inputObserver,
    _scrollers,
    _proxies,
    bridge: {
      // when normalizeScroll sets the scroll position (ss = setScroll)
      ss: function ss() {
        _lastScrollTime || _dispatch("scrollStart");
        _lastScrollTime = _getTime2();
      },
      // a way to get the _refreshing value in Observer
      ref: function ref() {
        return _refreshing;
      }
    }
  };
  _getGSAP3() && gsap3.registerPlugin(ScrollTrigger2);

  // node_modules/gsap/SplitText.js
  var gsap4;
  var _fonts;
  var _coreInitted3;
  var _initIfNecessary = () => _coreInitted3 || SplitText2.register(window.gsap);
  var _charSegmenter = typeof Intl !== "undefined" ? new Intl.Segmenter() : 0;
  var _toArray2 = (r2) => typeof r2 === "string" ? _toArray2(document.querySelectorAll(r2)) : "length" in r2 ? Array.from(r2) : [r2];
  var _elements = (targets) => _toArray2(targets).filter((e2) => e2 instanceof HTMLElement);
  var _emptyArray2 = [];
  var _context3 = function() {
  };
  var _spacesRegEx = /\s+/g;
  var _emojiSafeRegEx = new RegExp("\\p{RI}\\p{RI}|\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?(\\u{200D}\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?)*|.", "gu");
  var _emptyBounds = { left: 0, top: 0, width: 0, height: 0 };
  var _stretchToFitSpecialChars = (collection, specialCharsRegEx) => {
    if (specialCharsRegEx) {
      let charsFound = new Set(collection.join("").match(specialCharsRegEx) || _emptyArray2), i2 = collection.length, slots, word, char, combined;
      if (charsFound.size) {
        while (--i2 > -1) {
          word = collection[i2];
          for (char of charsFound) {
            if (char.startsWith(word) && char.length > word.length) {
              slots = 0;
              combined = word;
              while (char.startsWith(combined += collection[i2 + ++slots]) && combined.length < char.length) {
              }
              if (slots && combined.length === char.length) {
                collection[i2] = char;
                collection.splice(i2 + 1, slots);
                break;
              }
            }
          }
        }
      }
    }
    return collection;
  };
  var _disallowInline = (element) => window.getComputedStyle(element).display === "inline" && (element.style.display = "inline-block");
  var _insertNodeBefore = (newChild, parent, existingChild) => parent.insertBefore(typeof newChild === "string" ? document.createTextNode(newChild) : newChild, existingChild);
  var _getWrapper = (type, config, collection) => {
    let className = config[type + "sClass"] || "", { tag = "div", aria = "auto", propIndex = false } = config, display = type === "line" ? "block" : "inline-block", incrementClass = className.indexOf("++") > -1, wrapper = (text) => {
      let el = document.createElement(tag), i2 = collection.length + 1;
      className && (el.className = className + (incrementClass ? " " + className + i2 : ""));
      propIndex && el.style.setProperty("--" + type, i2 + "");
      aria !== "none" && el.setAttribute("aria-hidden", "true");
      if (tag !== "span") {
        el.style.position = "relative";
        el.style.display = display;
      }
      el.textContent = text;
      collection.push(el);
      return el;
    };
    incrementClass && (className = className.replace("++", ""));
    wrapper.collection = collection;
    return wrapper;
  };
  var _getLineWrapper = (element, nodes, config, collection) => {
    let lineWrapper = _getWrapper("line", config, collection), textAlign = window.getComputedStyle(element).textAlign || "left";
    return (startIndex, endIndex) => {
      let newLine = lineWrapper("");
      newLine.style.textAlign = textAlign;
      element.insertBefore(newLine, nodes[startIndex]);
      for (; startIndex < endIndex; startIndex++) {
        newLine.appendChild(nodes[startIndex]);
      }
      newLine.normalize();
    };
  };
  var _splitWordsAndCharsRecursively = (element, config, wordWrapper, charWrapper, prepForCharsOnly, deepSlice, ignore, charSplitRegEx, specialCharsRegEx, isNested) => {
    var _a;
    let nodes = Array.from(element.childNodes), i2 = 0, { wordDelimiter, reduceWhiteSpace = true, prepareText } = config, elementBounds = element.getBoundingClientRect(), lastBounds = elementBounds, isPreformatted = !reduceWhiteSpace && window.getComputedStyle(element).whiteSpace.substring(0, 3) === "pre", ignoredPreviousSibling = 0, wordsCollection = wordWrapper.collection, wordDelimIsNotSpace, wordDelimString, wordDelimSplitter, curNode, words, curWordEl, startsWithSpace, endsWithSpace, j, bounds, curWordChars, clonedNode, curSubNode, tempSubNode, curTextContent, wordText, lastWordText, k;
    if (typeof wordDelimiter === "object") {
      wordDelimSplitter = wordDelimiter.delimiter || wordDelimiter;
      wordDelimString = wordDelimiter.replaceWith || "";
    } else {
      wordDelimString = wordDelimiter === "" ? "" : wordDelimiter || " ";
    }
    wordDelimIsNotSpace = wordDelimString !== " ";
    for (; i2 < nodes.length; i2++) {
      curNode = nodes[i2];
      if (curNode.nodeType === 3) {
        curTextContent = curNode.textContent || "";
        if (reduceWhiteSpace) {
          curTextContent = curTextContent.replace(_spacesRegEx, " ");
        } else if (isPreformatted) {
          curTextContent = curTextContent.replace(/\n/g, wordDelimString + "\n");
        }
        prepareText && (curTextContent = prepareText(curTextContent, element));
        curNode.textContent = curTextContent;
        words = wordDelimString || wordDelimSplitter ? curTextContent.split(wordDelimSplitter || wordDelimString) : curTextContent.match(charSplitRegEx) || _emptyArray2;
        lastWordText = words[words.length - 1];
        endsWithSpace = wordDelimIsNotSpace ? lastWordText.slice(-1) === " " : !lastWordText;
        lastWordText || words.pop();
        lastBounds = elementBounds;
        startsWithSpace = wordDelimIsNotSpace ? words[0].charAt(0) === " " : !words[0];
        startsWithSpace && _insertNodeBefore(" ", element, curNode);
        words[0] || words.shift();
        _stretchToFitSpecialChars(words, specialCharsRegEx);
        deepSlice && isNested || (curNode.textContent = "");
        for (j = 1; j <= words.length; j++) {
          wordText = words[j - 1];
          if (!reduceWhiteSpace && isPreformatted && wordText.charAt(0) === "\n") {
            (_a = curNode.previousSibling) == null ? void 0 : _a.remove();
            _insertNodeBefore(document.createElement("br"), element, curNode);
            wordText = wordText.slice(1);
          }
          if (!reduceWhiteSpace && wordText === "") {
            _insertNodeBefore(wordDelimString, element, curNode);
          } else if (wordText === " ") {
            element.insertBefore(document.createTextNode(" "), curNode);
          } else {
            wordDelimIsNotSpace && wordText.charAt(0) === " " && _insertNodeBefore(" ", element, curNode);
            if (ignoredPreviousSibling && j === 1 && !startsWithSpace && wordsCollection.indexOf(ignoredPreviousSibling.parentNode) > -1) {
              curWordEl = wordsCollection[wordsCollection.length - 1];
              curWordEl.appendChild(document.createTextNode(charWrapper ? "" : wordText));
            } else {
              curWordEl = wordWrapper(charWrapper ? "" : wordText);
              _insertNodeBefore(curWordEl, element, curNode);
              ignoredPreviousSibling && j === 1 && !startsWithSpace && curWordEl.insertBefore(ignoredPreviousSibling, curWordEl.firstChild);
            }
            if (charWrapper) {
              curWordChars = _charSegmenter ? _stretchToFitSpecialChars([..._charSegmenter.segment(wordText)].map((s2) => s2.segment), specialCharsRegEx) : wordText.match(charSplitRegEx) || _emptyArray2;
              for (k = 0; k < curWordChars.length; k++) {
                curWordEl.appendChild(curWordChars[k] === " " ? document.createTextNode(" ") : charWrapper(curWordChars[k]));
              }
            }
            if (deepSlice && isNested) {
              curTextContent = curNode.textContent = curTextContent.substring(wordText.length + 1, curTextContent.length);
              bounds = curWordEl.getBoundingClientRect();
              if (bounds.top > lastBounds.top && bounds.left <= lastBounds.left) {
                clonedNode = element.cloneNode();
                curSubNode = element.childNodes[0];
                while (curSubNode && curSubNode !== curWordEl) {
                  tempSubNode = curSubNode;
                  curSubNode = curSubNode.nextSibling;
                  clonedNode.appendChild(tempSubNode);
                }
                element.parentNode.insertBefore(clonedNode, element);
                prepForCharsOnly && _disallowInline(clonedNode);
              }
              lastBounds = bounds;
            }
            if (j < words.length || endsWithSpace) {
              _insertNodeBefore(j >= words.length ? " " : wordDelimIsNotSpace && wordText.slice(-1) === " " ? " " + wordDelimString : wordDelimString, element, curNode);
            }
          }
        }
        element.removeChild(curNode);
        ignoredPreviousSibling = 0;
      } else if (curNode.nodeType === 1) {
        if (ignore && ignore.indexOf(curNode) > -1) {
          wordsCollection.indexOf(curNode.previousSibling) > -1 && wordsCollection[wordsCollection.length - 1].appendChild(curNode);
          ignoredPreviousSibling = curNode;
        } else {
          _splitWordsAndCharsRecursively(curNode, config, wordWrapper, charWrapper, prepForCharsOnly, deepSlice, ignore, charSplitRegEx, specialCharsRegEx, true);
          ignoredPreviousSibling = 0;
        }
        prepForCharsOnly && _disallowInline(curNode);
      }
    }
  };
  var _SplitText = class _SplitText2 {
    constructor(elements, config) {
      this.isSplit = false;
      _initIfNecessary();
      this.elements = _elements(elements);
      this.chars = [];
      this.words = [];
      this.lines = [];
      this.masks = [];
      this.vars = config;
      this._split = () => this.isSplit && this.split(this.vars);
      let orig = [], timerId, checkWidths = () => {
        let i2 = orig.length, o2;
        while (i2--) {
          o2 = orig[i2];
          let w = o2.element.offsetWidth;
          if (w !== o2.width) {
            o2.width = w;
            this._split();
            return;
          }
        }
      };
      this._data = { orig, obs: typeof ResizeObserver !== "undefined" && new ResizeObserver(() => {
        clearTimeout(timerId);
        timerId = setTimeout(checkWidths, 200);
      }) };
      _context3(this);
      this.split(config);
    }
    split(config) {
      this.isSplit && this.revert();
      this.vars = config = config || this.vars || {};
      let { type = "chars,words,lines", aria = "auto", deepSlice = true, smartWrap, onSplit, autoSplit = false, specialChars, mask } = this.vars, splitLines = type.indexOf("lines") > -1, splitCharacters = type.indexOf("chars") > -1, splitWords = type.indexOf("words") > -1, onlySplitCharacters = splitCharacters && !splitWords && !splitLines, specialCharsRegEx = specialChars && ("push" in specialChars ? new RegExp("(?:" + specialChars.join("|") + ")", "gu") : specialChars), finalCharSplitRegEx = specialCharsRegEx ? new RegExp(specialCharsRegEx.source + "|" + _emojiSafeRegEx.source, "gu") : _emojiSafeRegEx, ignore = !!config.ignore && _elements(config.ignore), { orig, animTime, obs } = this._data, onSplitResult;
      if (splitCharacters || splitWords || splitLines) {
        this.elements.forEach((element, index) => {
          orig[index] = {
            element,
            html: element.innerHTML,
            ariaL: element.getAttribute("aria-label"),
            ariaH: element.getAttribute("aria-hidden")
          };
          aria === "auto" ? element.setAttribute("aria-label", (element.textContent || "").trim()) : aria === "hidden" && element.setAttribute("aria-hidden", "true");
          let chars = [], words = [], lines = [], charWrapper = splitCharacters ? _getWrapper("char", config, chars) : null, wordWrapper = _getWrapper("word", config, words), i2, curWord, smartWrapSpan, nextSibling;
          _splitWordsAndCharsRecursively(element, config, wordWrapper, charWrapper, onlySplitCharacters, deepSlice && (splitLines || onlySplitCharacters), ignore, finalCharSplitRegEx, specialCharsRegEx, false);
          if (splitLines) {
            let nodes = _toArray2(element.childNodes), wrapLine = _getLineWrapper(element, nodes, config, lines), curNode, toRemove = [], lineStartIndex = 0, allBounds = nodes.map((n2) => n2.nodeType === 1 ? n2.getBoundingClientRect() : _emptyBounds), lastBounds = _emptyBounds;
            for (i2 = 0; i2 < nodes.length; i2++) {
              curNode = nodes[i2];
              if (curNode.nodeType === 1) {
                if (curNode.nodeName === "BR") {
                  toRemove.push(curNode);
                  wrapLine(lineStartIndex, i2 + 1);
                  lineStartIndex = i2 + 1;
                  lastBounds = allBounds[lineStartIndex];
                } else {
                  if (i2 && allBounds[i2].top > lastBounds.top && allBounds[i2].left <= lastBounds.left) {
                    wrapLine(lineStartIndex, i2);
                    lineStartIndex = i2;
                  }
                  lastBounds = allBounds[i2];
                }
              }
            }
            lineStartIndex < i2 && wrapLine(lineStartIndex, i2);
            toRemove.forEach((el) => {
              var _a;
              return (_a = el.parentNode) == null ? void 0 : _a.removeChild(el);
            });
          }
          if (!splitWords) {
            for (i2 = 0; i2 < words.length; i2++) {
              curWord = words[i2];
              if (splitCharacters || !curWord.nextSibling || curWord.nextSibling.nodeType !== 3) {
                if (smartWrap && !splitLines) {
                  smartWrapSpan = document.createElement("span");
                  smartWrapSpan.style.whiteSpace = "nowrap";
                  while (curWord.firstChild) {
                    smartWrapSpan.appendChild(curWord.firstChild);
                  }
                  curWord.replaceWith(smartWrapSpan);
                } else {
                  curWord.replaceWith(...curWord.childNodes);
                }
              } else {
                nextSibling = curWord.nextSibling;
                if (nextSibling && nextSibling.nodeType === 3) {
                  nextSibling.textContent = (curWord.textContent || "") + (nextSibling.textContent || "");
                  curWord.remove();
                }
              }
            }
            words.length = 0;
            element.normalize();
          }
          this.lines.push(...lines);
          this.words.push(...words);
          this.chars.push(...chars);
        });
        mask && this[mask] && this.masks.push(...this[mask].map((el) => {
          let maskEl = el.cloneNode();
          el.replaceWith(maskEl);
          maskEl.appendChild(el);
          el.className && (maskEl.className = el.className.replace(/(\b\w+\b)/g, "$1-mask"));
          maskEl.style.overflow = "clip";
          return maskEl;
        }));
      }
      this.isSplit = true;
      _fonts && (autoSplit ? _fonts.addEventListener("loadingdone", this._split) : _fonts.status === "loading" && console.warn("SplitText called before fonts loaded"));
      if ((onSplitResult = onSplit && onSplit(this)) && onSplitResult.totalTime) {
        this._data.anim = animTime ? onSplitResult.totalTime(animTime) : onSplitResult;
      }
      splitLines && autoSplit && this.elements.forEach((element, index) => {
        orig[index].width = element.offsetWidth;
        obs && obs.observe(element);
      });
      return this;
    }
    revert() {
      var _a, _b;
      let { orig, anim, obs } = this._data;
      obs && obs.disconnect();
      orig.forEach(({ element, html, ariaL, ariaH }) => {
        element.innerHTML = html;
        ariaL ? element.setAttribute("aria-label", ariaL) : element.removeAttribute("aria-label");
        ariaH ? element.setAttribute("aria-hidden", ariaH) : element.removeAttribute("aria-hidden");
      });
      this.chars.length = this.words.length = this.lines.length = orig.length = this.masks.length = 0;
      this.isSplit = false;
      _fonts == null ? void 0 : _fonts.removeEventListener("loadingdone", this._split);
      if (anim) {
        this._data.animTime = anim.totalTime();
        anim.revert();
      }
      (_b = (_a = this.vars).onRevert) == null ? void 0 : _b.call(_a, this);
      return this;
    }
    static create(elements, config) {
      return new _SplitText2(elements, config);
    }
    static register(core) {
      gsap4 = gsap4 || core || window.gsap;
      if (gsap4) {
        _toArray2 = gsap4.utils.toArray;
        _context3 = gsap4.core.context || _context3;
      }
      if (!_coreInitted3 && window.innerWidth > 0) {
        _fonts = document.fonts;
        _coreInitted3 = true;
      }
    }
  };
  _SplitText.version = "3.13.0";
  var SplitText2 = _SplitText;

  // js/modules.js
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      gsap.registerPlugin(ScrollTrigger2, SplitText2);
      const g3 = {};
      window.g = g3;
      g3.scrollTrigger = ScrollTrigger2;
      g3.splitText = SplitText2;
      g3.pxToRem = (px) => {
        return px / 16 * 1 + "rem";
      };
      handleLazyLoad();
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t2) => Math.min(1, 1.001 - Math.pow(2, -10 * t2)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false
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
      lenis.stop();
      $(document).ready(function() {
        lenis.start();
      });
      window.lenis = lenis;
      getFontSize();
      window.addEventListener("resize", () => {
        getFontSize();
      });
      getLinkColor();
      const buttonElements = document.querySelectorAll("[data-button-text]");
      buttonElements.forEach((element) => {
        new Button(element);
      });
      const rollerElements = document.querySelectorAll("[data-roller]");
      rollerElements.forEach((element) => {
        new Roller(element);
      });
      const hexElements = document.querySelectorAll(".bg-hex");
      hexElements.forEach((element) => {
        new Hex(element);
      });
      const shrinkText = document.querySelectorAll("[data-shrink]");
      shrinkText.forEach((element) => {
        new ShrinkText(element);
      });
      const testimonialElements = document.querySelectorAll("[testimonial]");
      testimonialElements.forEach((element) => {
        new Testimonials(element);
      });
      const faqElements = document.querySelectorAll("[faq]");
      faqElements.forEach((element) => {
        new FaqElements(element);
      });
      const movingHexElements = document.querySelectorAll("[moving-hex]");
      movingHexElements.forEach((element) => {
        new MovingHex(element);
      });
      const movingHexAnimationElements = document.querySelectorAll("[data-animation='moving-hex']");
      movingHexAnimationElements.forEach((element) => {
        new MovingHex(element);
      });
      const dictionElements = document.querySelectorAll("[data-animation='diction']");
      dictionElements.forEach((element) => {
        new Diction(element);
      });
      const megamenuElements = document.querySelectorAll("[megamenu]");
      megamenuElements.forEach((element) => {
        new Megamenu(element);
      });
      const videoModalElements = document.querySelectorAll("[data-video]");
      videoModalElements.forEach((element) => {
        new Video(element);
      });
      const parallaxElements = document.querySelectorAll("[data-animation='parallax']");
      parallaxElements.forEach((element) => {
        new Parallax(element);
      });
      const membershipsElements = document.querySelectorAll("[data-animation='memberships']");
      membershipsElements.forEach((element) => {
        new Memberships(element);
      });
      const interactiveHexElements = document.querySelectorAll("[data-animation='interactivehex']");
      interactiveHexElements.forEach((element) => {
        new InteractiveHex(element);
      });
      const staggerElements = document.querySelectorAll("[data-animation='stagger']");
      staggerElements.forEach((element) => {
        new Stagger(element);
      });
      const headingWaveElements = document.querySelectorAll("[data-animation='headingWave']");
      headingWaveElements.forEach((element) => {
        new HeadingWave(element);
      });
      const imageElements = document.querySelectorAll("[data-animation='image']");
      imageElements.forEach((element) => {
        new Image(element);
      });
      const ballsElements = document.querySelectorAll("[data-animation='balls']");
      ballsElements.forEach((element) => {
        new Balls(element);
      });
      const annotationElements = document.querySelectorAll("[data-annotation]");
      annotationElements.forEach((element) => {
        new Annotations(element);
      });
      const searchResultsElements = document.querySelectorAll("[search-results]");
      searchResultsElements.forEach((element) => {
        new SearchResults(element);
      });
    });
  }
  function getFontSize() {
    const breakpoint = window.innerWidth < 768 ? "small" : window.innerWidth < 992 ? "medium" : "desktop";
    let fontSize = breakpoint === "small" ? Math.max(9, document.body.clientWidth / 767 * 16) : breakpoint === "medium" ? Math.max(14, document.body.clientWidth / 991 * 16) : Math.max(14, Math.min(document.body.clientWidth / 1290 * 16, 16));
    document.documentElement.style.setProperty("--fontSize", fontSize + "px");
  }
  function handleLazyLoad(config = {}) {
    let lazyImages = gsap.utils.toArray("img[loading='lazy']"), timeout = gsap.delayedCall(config.timeout || 1, ScrollTrigger2.refresh).pause(), lazyMode = config.lazy !== false, imgLoaded = lazyImages.length, onImgLoad = () => lazyMode ? timeout.restart(true) : --imgLoaded || ScrollTrigger2.refresh();
    lazyImages.forEach((img, i2) => {
      lazyMode || (img.loading = "eager");
      img.naturalWidth ? onImgLoad() : img.addEventListener("load", onImgLoad);
    });
  }
  function splitTextGradient(parent, chars) {
    const color1 = getComputedStyle(parent).getPropertyValue("--color1");
    const color2 = getComputedStyle(parent).getPropertyValue("--color2");
    const color = gsap.utils.interpolate(color1, color2);
    gsap.set(chars, {
      color: (index, target, targets) => color(index / (targets.length - 1))
    });
  }
  function getLinkColor() {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      const color = getComputedStyle(link).getPropertyValue("color");
      link.style.setProperty("--color", color);
    });
  }
})();
/*! Bundled license information:

gsap/Observer.js:
  (*!
   * Observer 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license
   * @author: Jack Doyle, jack@greensock.com
  *)

gsap/ScrollTrigger.js:
  (*!
   * ScrollTrigger 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license
   * @author: Jack Doyle, jack@greensock.com
  *)

gsap/SplitText.js:
  (*!
   * SplitText 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2025, GreenSock. All rights reserved. Subject to the terms at https://gsap.com/standard-license.
   * @author: Jack Doyle
   *)
*/

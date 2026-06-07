;(function () {
  'use strict'

  // ─── pxToRem ───────────────────────────────────────────────
  const pxToRem = (pixels) => pixels / 16

  // ─── MatchMedia ────────────────────────────────────────────
  const MatchMedia = {
    mobile: window.matchMedia(`(width <= ${pxToRem(767.98)}rem)`),
  }

  // ─── defineScrollBarWidthCSSVar ────────────────────────────
  const defineScrollBarWidthCSSVar = () => {
    document.documentElement.style.setProperty(
      '--scrollbar-width',
      `${window.innerWidth - document.documentElement.clientWidth}px`
    )
  }

  // ─── BaseComponent ─────────────────────────────────────────
  class BaseComponent {
    constructor() {
      if (this.constructor === BaseComponent) {
        throw new Error('Невозможно создать экземпляр абстрактного класса BaseComponent!')
      }
    }

    getProxyState(initialState) {
      return new Proxy(initialState, {
        get: (target, prop) => target[prop],
        set: (target, prop, newValue) => {
          const oldValue = target[prop]
          target[prop] = newValue
          if (newValue !== oldValue) this.updateUI()
          return true
        },
      })
    }

    updateUI() {
      throw new Error('Необходимо реализовать метод updateUI!')
    }
  }

  // ─── Header ────────────────────────────────────────────────
  class Header {
    selectors = {
      root: '[data-js-header]',
      overlay: '[data-js-header-overlay]',
      burgerButton: '[data-js-header-burger-button]',
    }

    stateClasses = {
      isActive: 'is-active',
      isLock: 'is-lock',
    }

    constructor() {
      this.rootElement = document.querySelector(this.selectors.root)
      if (!this.rootElement) return
      this.overlayElement = this.rootElement.querySelector(this.selectors.overlay)
      this.burgerButtonElement = this.rootElement.querySelector(this.selectors.burgerButton)
      this.bindEvents()
    }

    onBurgerButtonClick = () => {
      this.burgerButtonElement.classList.toggle(this.stateClasses.isActive)
      this.overlayElement.classList.toggle(this.stateClasses.isActive)
      document.documentElement.classList.toggle(this.stateClasses.isLock)
    }

    bindEvents() {
      this.burgerButtonElement.addEventListener('click', this.onBurgerButtonClick)
    }
  }

  // ─── Tabs ──────────────────────────────────────────────────
  const tabsRootSelector = '[data-js-tabs]'

  class Tabs extends BaseComponent {
    selectors = {
      root: tabsRootSelector,
      button: '[data-js-tabs-button]',
      content: '[data-js-tabs-content]',
    }

    stateClasses = { isActive: 'is-active' }

    stateAttributes = {
      ariaSelected: 'aria-selected',
      tabIndex: 'tabindex',
    }

    constructor(rootElement) {
      super()
      this.rootElement = rootElement
      this.buttonElements = this.rootElement.querySelectorAll(this.selectors.button)
      this.contentElements = this.rootElement.querySelectorAll(this.selectors.content)
      this.state = this.getProxyState({
        activeTabIndex: [...this.buttonElements].findIndex((el) =>
          el.classList.contains(this.stateClasses.isActive)
        ),
      })
      this.limitTabsIndex = this.buttonElements.length - 1
      this.bindEvents()
    }

    updateUI() {
      const { activeTabIndex } = this.state
      this.buttonElements.forEach((el, index) => {
        const isActive = index === activeTabIndex
        el.classList.toggle(this.stateClasses.isActive, isActive)
        el.setAttribute(this.stateAttributes.ariaSelected, isActive.toString())
        el.setAttribute(this.stateAttributes.tabIndex, isActive ? '0' : '-1')
      })
      this.contentElements.forEach((el, index) => {
        el.classList.toggle(this.stateClasses.isActive, index === activeTabIndex)
      })
    }

    activateTab(newTabIndex) {
      this.state.activeTabIndex = newTabIndex
      this.buttonElements[newTabIndex].focus()
    }

    previousTab = () => {
      const i = this.state.activeTabIndex === 0 ? this.limitTabsIndex : this.state.activeTabIndex - 1
      this.activateTab(i)
    }

    nextTab = () => {
      const i = this.state.activeTabIndex === this.limitTabsIndex ? 0 : this.state.activeTabIndex + 1
      this.activateTab(i)
    }

    firstTab = () => this.activateTab(0)
    lastTab = () => this.activateTab(this.limitTabsIndex)

    onButtonClick(buttonIndex) {
      this.state.activeTabIndex = buttonIndex
    }

    onKeyDown = (event) => {
      const { code, metaKey } = event
      if (metaKey && code === 'ArrowLeft') { this.firstTab(); return }
      if (metaKey && code === 'ArrowRight') { this.lastTab(); return }
      const action = { ArrowLeft: this.previousTab, ArrowRight: this.nextTab, Home: this.firstTab, End: this.lastTab }[code]
      action?.()
    }

    bindEvents() {
      this.buttonElements.forEach((el, index) => {
        el.addEventListener('click', () => this.onButtonClick(index))
      })
      this.rootElement.addEventListener('keydown', this.onKeyDown)
    }
  }

  class TabsCollection {
    constructor() {
      document.querySelectorAll(tabsRootSelector).forEach((el) => new Tabs(el))
    }
  }

  // ─── VideoPlayer ───────────────────────────────────────────
  const videoRootSelector = '[data-js-video-player]'

  class VideoPlayer {
    selectors = {
      video: '[data-js-video-player-video]',
      panel: '[data-js-video-player-panel]',
      playButton: '[data-js-video-player-play-button]',
    }

    stateClasses = { isActive: 'is-active' }

    constructor(rootElement) {
      this.rootElement = rootElement
      this.videoElement = this.rootElement.querySelector(this.selectors.video)
      this.panelElement = this.rootElement.querySelector(this.selectors.panel)
      this.playButtonElement = this.rootElement.querySelector(this.selectors.playButton)
      this.bindEvents()
    }

    onPlayButtonClick = () => {
      this.videoElement.play()
      this.videoElement.controls = true
      this.panelElement.classList.remove(this.stateClasses.isActive)
    }

    onVideoPause = () => {
      this.videoElement.controls = false
      this.panelElement.classList.add(this.stateClasses.isActive)
    }

    bindEvents() {
      this.playButtonElement.addEventListener('click', this.onPlayButtonClick)
      this.videoElement.addEventListener('pause', this.onVideoPause)
    }
  }

  class VideoPlayerCollection {
    constructor() {
      document.querySelectorAll(videoRootSelector).forEach((el) => new VideoPlayer(el))
    }
  }

  // ─── ExpandableContent ─────────────────────────────────────
  const expandableRootSelector = '[data-js-expandable-content]'

  class ExpandableContent {
    selectors = {
      button: '[data-js-expandable-content-button]',
    }

    stateClasses = { isExpanded: 'is-expanded' }

    animationParams = { duration: 500, easing: 'ease' }

    constructor(rootElement) {
      this.rootElement = rootElement
      this.buttonElement = this.rootElement.querySelector(this.selectors.button)
      this.bindEvents()
    }

    expand() {
      const { offsetHeight, scrollHeight } = this.rootElement
      this.rootElement.classList.add(this.stateClasses.isExpanded)
      this.rootElement.animate(
        [{ maxHeight: `${pxToRem(offsetHeight)}rem` }, { maxHeight: `${pxToRem(scrollHeight)}rem` }],
        this.animationParams
      )
    }

    collapse() {
      const { offsetHeight, scrollHeight } = this.rootElement
      this.rootElement.animate(
        [{ maxHeight: `${pxToRem(scrollHeight)}rem` }, { maxHeight: `${pxToRem(offsetHeight)}rem` }],
        this.animationParams
      ).onfinish = () => this.rootElement.classList.remove(this.stateClasses.isExpanded)
    }

    toggle() {
      this.rootElement.classList.contains(this.stateClasses.isExpanded) ? this.collapse() : this.expand()
    }

    onButtonClick = () => this.toggle()

    bindEvents() {
      this.buttonElement.addEventListener('click', this.onButtonClick)
    }
  }

  class ExpandableContentCollection {
    constructor() {
      document.querySelectorAll(expandableRootSelector).forEach((el) => new ExpandableContent(el))
    }
  }

  // ─── InputMask ─────────────────────────────────────────────
  const inputMaskRootSelector = '[data-js-input-mask]'

  class InputMask {
    constructor(rootElement) {
      this.rootElement = rootElement
      this.init()
    }

    init() {
      if (typeof window.IMask !== 'undefined') {
        window.IMask(this.rootElement, { mask: this.rootElement.dataset.jsInputMask })
      } else {
        console.error('Библиотека "imask" не подключена!')
      }
    }
  }

  class InputMaskCollection {
    constructor() {
      document.querySelectorAll(inputMaskRootSelector).forEach((el) => new InputMask(el))
    }
  }

  // ─── Select ────────────────────────────────────────────────
  const selectRootSelector = '[data-js-select]'

  class Select extends BaseComponent {
    selectors = {
      root: selectRootSelector,
      originalControl: '[data-js-select-original-control]',
      button: '[data-js-select-button]',
      dropdown: '[data-js-select-dropdown]',
      option: '[data-js-select-option]',
    }

    stateClasses = {
      isExpanded: 'is-expanded',
      isSelected: 'is-selected',
      isCurrent: 'is-current',
      isOnTheLeftSide: 'is-on-the-left-side',
      isOnTheRightSide: 'is-on-the-right-side',
    }

    stateAttributes = {
      ariaExpanded: 'aria-expanded',
      ariaSelected: 'aria-selected',
      ariaActiveDescendant: 'aria-activedescendant',
    }

    initialState = {
      isExpanded: false,
      currentOptionIndex: null,
      selectedOptionElement: null,
    }

    constructor(rootElement) {
      super()
      this.rootElement = rootElement
      this.originalControlElement = this.rootElement.querySelector(this.selectors.originalControl)
      this.buttonElement = this.rootElement.querySelector(this.selectors.button)
      this.dropdownElement = this.rootElement.querySelector(this.selectors.dropdown)
      this.optionElements = this.dropdownElement.querySelectorAll(this.selectors.option)
      this.state = this.getProxyState({
        ...this.initialState,
        currentOptionIndex: this.originalControlElement.selectedIndex,
        selectedOptionElement: this.optionElements[this.originalControlElement.selectedIndex],
      })
      this.fixDropdownPosition()
      this.updateTabIndexes()
      this.bindEvents()
    }

    updateUI() {
      const { isExpanded, currentOptionIndex, selectedOptionElement } = this.state
      const newVal = selectedOptionElement.textContent.trim()

      this.originalControlElement.value = newVal
      this.buttonElement.textContent = newVal
      this.buttonElement.classList.toggle(this.stateClasses.isExpanded, isExpanded)
      this.buttonElement.setAttribute(this.stateAttributes.ariaExpanded, isExpanded)
      this.buttonElement.setAttribute(this.stateAttributes.ariaActiveDescendant, this.optionElements[currentOptionIndex].id)
      this.dropdownElement.classList.toggle(this.stateClasses.isExpanded, isExpanded)

      this.optionElements.forEach((el, index) => {
        const isCurrent = currentOptionIndex === index
        const isSelected = selectedOptionElement === el
        el.classList.toggle(this.stateClasses.isCurrent, isCurrent)
        el.classList.toggle(this.stateClasses.isSelected, isSelected)
        el.setAttribute(this.stateAttributes.ariaSelected, isSelected)
      })
    }

    toggleExpandedState() { this.state.isExpanded = !this.state.isExpanded }
    expand() { this.state.isExpanded = true }
    collapse() { this.state.isExpanded = false }

    fixDropdownPosition() {
      const viewportWidth = document.documentElement.clientWidth
      const { width, x } = this.buttonElement.getBoundingClientRect()
      const isLeft = (x + width / 2) < viewportWidth / 2
      this.dropdownElement.classList.toggle(this.stateClasses.isOnTheLeftSide, isLeft)
      this.dropdownElement.classList.toggle(this.stateClasses.isOnTheRightSide, !isLeft)
    }

    updateTabIndexes(isMobile = MatchMedia.mobile.matches) {
      this.originalControlElement.tabIndex = isMobile ? 0 : -1
      this.buttonElement.tabIndex = isMobile ? -1 : 0
    }

    get isNeedToExpand() {
      return !this.state.isExpanded && document.activeElement === this.buttonElement
    }

    selectCurrentOption() {
      this.state.selectedOptionElement = this.optionElements[this.state.currentOptionIndex]
    }

    onButtonClick = () => this.toggleExpandedState()

    onClick = (event) => {
      const { target } = event
      const isButtonClick = target === this.buttonElement
      const isOutside = target.closest(this.selectors.dropdown) !== this.dropdownElement
      if (!isButtonClick && isOutside) { this.collapse(); return }
      if (target.matches(this.selectors.option)) {
        this.state.selectedOptionElement = target
        this.state.currentOptionIndex = [...this.optionElements].findIndex((el) => el === target)
        this.collapse()
      }
    }

    onArrowUpKeyDown = () => {
      if (this.isNeedToExpand) { this.expand(); return }
      if (this.state.currentOptionIndex > 0) this.state.currentOptionIndex--
    }

    onArrowDownKeyDown = () => {
      if (this.isNeedToExpand) { this.expand(); return }
      if (this.state.currentOptionIndex < this.optionElements.length - 1) this.state.currentOptionIndex++
    }

    onSpaceKeyDown = () => {
      if (this.isNeedToExpand) { this.expand(); return }
      this.selectCurrentOption(); this.collapse()
    }

    onEnterKeyDown = () => {
      if (this.isNeedToExpand) { this.expand(); return }
      this.selectCurrentOption(); this.collapse()
    }

    onKeyDown = (event) => {
      const action = {
        ArrowUp: this.onArrowUpKeyDown,
        ArrowDown: this.onArrowDownKeyDown,
        Space: this.onSpaceKeyDown,
        Enter: this.onEnterKeyDown,
      }[event.code]
      if (action) { event.preventDefault(); action() }
    }

    onMobileMatchMediaChange = (event) => this.updateTabIndexes(event.matches)
    onOriginalControlChange = () => {
      this.state.selectedOptionElement = this.optionElements[this.originalControlElement.selectedIndex]
    }

    bindEvents() {
      MatchMedia.mobile.addEventListener('change', this.onMobileMatchMediaChange)
      this.buttonElement.addEventListener('click', this.onButtonClick)
      document.addEventListener('click', this.onClick)
      this.rootElement.addEventListener('keydown', this.onKeyDown)
      this.originalControlElement.addEventListener('change', this.onOriginalControlChange)
    }
  }

  class SelectCollection {
    constructor() {
      document.querySelectorAll(selectRootSelector).forEach((el) => new Select(el))
    }
  }

  // ─── Init ──────────────────────────────────────────────────
  new Header()
  new TabsCollection()
  new VideoPlayerCollection()
  new ExpandableContentCollection()
  new InputMaskCollection()
  new SelectCollection()
  defineScrollBarWidthCSSVar()

})()

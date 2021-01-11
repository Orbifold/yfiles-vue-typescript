import {Workarounds} from 'yfiles'

/**
 * Binds the given command to the input element specified by the given selector.
 *
 * @param {string} selector
 * @param {ICommand} command
 * @param {CanvasComponent|GraphComponent} target
 * @param {Object?} parameter
 */
export function bindCommand(selector, command, target, parameter) {
    const element = document.querySelector(selector);
    if (arguments.length < 4) {
        parameter = null;
        if (arguments.length < 3) {
            target = null
        }
    }
    if (!element) {
        return
    }
    command.addCanExecuteChangedListener((sender, e) => {
        if (command.canExecute(parameter, target)) {
            element.removeAttribute('disabled')
        } else {
            element.setAttribute('disabled', 'disabled')
        }
    });
    element.addEventListener('click', e => {
        if (command.canExecute(parameter, target)) {
            command.execute(parameter, target)
        }
    })
}

export function bindAction(/**string*/ selector, /**function(Event)*/ action) {
    const element = document.querySelector(selector);
    if (!element) {
        return
    }
    element.addEventListener('click', e => {
        action(e)
    })
}

export function bindActions(/**string*/ selectors, /**function(Event)*/ action) {
    const elements = document.querySelectorAll(selectors);
    if (!elements) {
        return
    }
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        element.addEventListener('click', e => {
            action(e)
        })
    }
}

export function bindChangeListener(/**string*/ selector, /**function(string|boolean)*/ action) {
    const element = document.querySelector(selector);
    if (!element) {
        return
    }
    element.addEventListener('change', e => {
        if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
            action(e.target.checked)
        } else {
            action(e.target.value)
        }
    })
}

/** @return {number} */
export function detectChromeVersion() {
    // Edge pretends to be every browser...
    const ieVersion = detectInternetExplorerVersion();
    if (ieVersion === -1) {
        if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
            return -1
        }
        const ua = window.navigator.userAgent;
        const chrome = ua.match(new RegExp('Chrome\\/([0-9]+)', ''));
        if (chrome !== null) {
            return parseInt(chrome[1])
        }
    }
    return -1
}

/**
 * Returns version of Firefox.
 * @return {number} Version of Firefox or -1 if browser is not Firefox.
 */
export function detectFirefoxVersion() {
    if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
        return -1
    }
    const ua = window.navigator.userAgent;
    const firefox = ua.match(new RegExp('Firefox\\/([0-9]+)', ''));
    if (firefox !== null) {
        return parseInt(firefox[1])
    }
    return -1
}

/**
 * Returns version of IE if browser is MS Internet Explorer.
 * @return {number}
 * Version of IE if browser is MS Internet Explorer/Edge or
 * -1 if browser is not InternetExplorer/Edge.
 */
export function detectInternetExplorerVersion() {
    // environments without window object
    if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
        return -1
    }

    const ua = window.navigator.userAgent;
    const msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        return parseInt(ua.substr(msie + 5, ua.indexOf('.', msie)), 10)
    }

    const trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        const rv = ua.indexOf('rv:');
        return parseInt(ua.substr(rv + 3, ua.indexOf('.', rv)), 10)
    }

    const edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // IE 12 => return version number
        return parseInt(ua.substr(edge + 5, ua.indexOf('.', edge)), 10)
    }

    return -1
}

/**
 * Returns the windows NT version or -1 if it is lower than windows 95 or another OS.
 * See also https://stackoverflow.com/questions/228256/operating-system-from-user-agent-http-header
 * @return {number}
 * The windows NT version or the windows version for windows 98 or older:
 * <ul>
 *   <li>95: Windows 95</li>
 *   <li>98: Windows 98</li>
 *   <li>4.0: Windows NT 4.0</li>
 *   <li>5.0: Windows 2000</li>
 *   <li>5.1: Windows XP</li>
 *   <li>5.2: Windows Server 2003</li>
 *   <li>6.0: Windows Vista</li>
 *   <li>6.1: Windows 7</li>
 *   <li>6.2: Windows 8</li>
 *   <li>10.0: Windows 10</li>
 * </ul>
 */
export function detectWindowsVersion() {
    // environments without window object
    if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
        return -1
    }

    const ua = window.navigator.userAgent;
    // newer than windows 98
    const winNT = new RegExp('Windows NT (\\d*\\.\\d*)', '').exec(ua);
    if (winNT) {
        return parseFloat(winNT[1])
    }

    // alternative win xp
    if (ua.indexOf('Windows XP') > 0) {
        return 5.1
    }

    // alternative win 2000
    if (ua.indexOf('Windows 2000') > 0) {
        return 5.0
    }

    // windows 98
    if (ua.indexOf('Windows 98') > 0 || ua.indexOf('Win98') > 0) {
        return 98
    }

    // windows 95
    if (ua.indexOf('Windows 95') > 0 || ua.indexOf('Win95') > 0 || ua.indexOf('Windows_95') > 0) {
        return 95
    }

    return -1
}

/**
 * Returns whether this is an ARM device.
 * @return {boolean} true if ARM device, false otherwise
 */
export function detectArmDevice() {
    const ua = window.navigator.userAgent;
    return !!/ARM;/.exec(ua)
}

/**
 * Returns the iOS version or -1 if it is another OS.
 * See also https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
 * @return {number}
 * The iOS version:
 * <ul>
 *   <li>3: iOS 3 or less</li>
 *   <li>4: iOS 4</li>
 *   <li>5: iOS 5</li>
 *   <li>6: iOS 6</li>
 *   <li>7: iOS 7</li>
 *   <li>8: iOS 8 - 12</li>
 * </ul>
 * NOTE: Since iOS 13, the user agent changed such that iOS and Mac OS X cannot be
 * distinguished anymore, therefore this will return -1 for Safari on iOS 13. However, it still
 * works on e.g. Chrome on iOS.
 */
export function detectiOSVersion() {
    const ua = window.navigator.userAgent;

    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        if (window.indexedDB) {
            return 8
        }
        if (window.SpeechSynthesisUtterance) {
            return 7
        }
        if (window.webkitAudioContext) {
            return 6
        }
        if (window.matchMedia) {
            return 5
        }
        if (window.history && 'pushState' in window.history) {
            return 4
        }
        return 3
    }

    return -1
}

/**
 * Returns version of Safari.
 * @return {number} Version of Safari or -1 if browser is not Safari.
 */
export function detectSafariVersion() {
    const ua = window.navigator.userAgent;
    const isSafari = ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1;
    if (isSafari) {
        const safariVersionMatch = ua.match(new RegExp('Version\\/(\\d*\\.\\d*)', ''));
        if (safariVersionMatch && safariVersionMatch.length > 1) {
            return parseInt(safariVersionMatch[1])
        }
    }
    return -1
}

/**
 * Returns true for browsers that use the Safari 11 Webkit engine.
 *
 * In detail, these are Safari 11 on either macOS or iOS, Chrome on iOS 11, and Firefox on iOS 11.
 * @return {boolean}
 */
export function detectSafari11Webkit() {
    return (
        detectSafariVersion() === 11 || !!/OS\s+11_.*(CriOS|FxiOS)/.exec(window.navigator.userAgent)
    )
}

/**
 * Returns whether or not the browser supports active and passive event listeners. Feature Detection.
 * @return {boolean}
 */
function detectPassiveSupported() {
    let supported = false;
    // noinspection EmptyCatchBlockJS
    try {
        const opts = Object.defineProperty({}, 'passive', {
            get: () => {
                supported = true
            }
        });
        window.addEventListener('test', null, opts)
    } catch (ignored) {
        // eslint-disable-next-line
    }

    return supported
}

/**
 * Returns whether or not the browser supports native drag and drop events and custom dataTransfer types.
 * @return {boolean}
 */
function detectNativeDragAndDropSupported() {
    const div = document.createElement('div');
    const hasDndSupport = 'draggable' in div || ('ondragstart' in div && 'ondrop' in div);
    const ieVersion = detectInternetExplorerVersion();
    const hasCustomTypeSupport = ieVersion === -1 || ieVersion > 11;
    return hasDndSupport && hasCustomTypeSupport
}

/**
 * Returns whether or not the browser supports the pointer-events CSS property.
 * @return {boolean}
 */
function detectPointerEventsSupported() {
    const testDiv = document.createElement('div');
    testDiv.style.cssText = 'pointer-events:auto';
    return testDiv.style.pointerEvents === 'auto'
}

/**
 * Returns whether or not the browser supports WebGL rendering.
 * @return {boolean}
 */
function detectWebGlSupported() {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl')
}

export function enableWorkarounds() {
    const internetExplorerVersion = detectInternetExplorerVersion();
    const chromeVersion = detectChromeVersion();
    const windowsVersion = detectWindowsVersion();
    const firefoxVersion = detectFirefoxVersion();

    // Enable support for labels with consecutive spaces in IE
    if (internetExplorerVersion !== -1) {
        Workarounds.ie964525 = true
    }
    // The following workaround addresses two issues
    // 1) Firefox is very slow when SVG matrices are modified directly:
    //    https://bugzilla.mozilla.org/show_bug.cgi?id=1419764
    // 2) A transform caching regression in Safari 11 and all WebKit browsers on iOS 11.
    if (firefoxVersion !== -1 || detectSafari11Webkit()) {
        Workarounds.CR320635 = true
    }
    // Fix uppercase attribute names in Edge
    if (internetExplorerVersion >= 12) {
        Workarounds.edge2057021 = true
    }
    // Fix broken hrefs in IE 11 on Windows 10 or on certain Windows 8 Surface devices
    if (
        internetExplorerVersion === 11 &&
        (windowsVersion === 10 || ((windowsVersion | 0) === 6 && detectArmDevice()))
    ) {
        Workarounds.ie2337112 = true
    }
    // Fix SVG transform issue in Chrome 57
    if (chromeVersion === 57) {
        Workarounds.cr701075 = true
    }

    // Prevent default for context menu key - it is handled by the context menu implementation
    Workarounds.cr433873 = true
}

/** @return {Element} */
export function addClass(/**Element*/ e, /**string*/ className) {
    const classes = e.getAttribute('class');
    if (classes === null || classes === '') {
        e.setAttribute('class', className)
    } else if (!hasClass(e, className)) {
        e.setAttribute('class', `${classes} ${className}`)
    }
    return e
}

/** @return {Element} */
export function removeClass(/**Element*/ e, /**string*/ className) {
    const classes = e.getAttribute('class');
    if (classes !== null && classes !== '') {
        if (classes === className) {
            e.setAttribute('class', '')
        } else {
            const result = classes
                .split(' ')
                .filter(s => s !== className)
                .join(' ');
            e.setAttribute('class', result)
        }
    }
    return e
}

/** @return {boolean} */
export function hasClass(/**Element*/ e, /**string*/ className) {
    const classes = e.getAttribute('class');
    const r = new RegExp(`\\b${className}\\b`, '');
    return r.test(classes)
}

/** @return {Element} */
export function toggleClass(/**Element*/ e, /**string*/ className) {
    if (hasClass(e, className)) {
        removeClass(e, className)
    } else {
        addClass(e, className)
    }
    return e
}

/** States whether the browser supports passive event listeners */
export const passiveSupported = detectPassiveSupported();
/** States whether the browser supports native drag and drop events */
export const nativeDragAndDropSupported = detectNativeDragAndDropSupported();
/** States whether the browser supports the pointer-events CSS property */
export const pointerEventsSupported = detectPointerEventsSupported();
/** States whether the browser supports WebGL rendering */
export const webGlSupported = detectWebGlSupported();

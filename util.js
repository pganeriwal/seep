export const isObject = function (obj) {
    return obj && "[object Object]" === Object.prototype.toString.call(obj);
};

export const forEachInOrder = function (obj, iteratorFunction) {
    if ((Array.isArray(obj) || isObject(obj)) && "function" === typeof iteratorFunction) {
        var keysInOrder = null;
        try {
            keysInOrder = Object.keys(obj);
        } catch (e) {
            keysInOrder = null;
        }
        if (keysInOrder) {
            keysInOrder.forEach((key, index, keysArray) => {
                if (key) {
                    iteratorFunction(obj[key], key, index, keysArray);
                }
            });
        }
    }
};

export const shuffleArray = function (array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

export const pushToArray = function (dest, source) {
    let ret = false;
    if (Array.isArray(dest) && Array.isArray(source)) {
        Array.prototype.push.apply(dest, source);
        ret = true;
    }
    return ret;
};
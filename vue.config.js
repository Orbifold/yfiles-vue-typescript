module.exports = {
    "productionSourceMap": false,
    "configureWebpack": {
        "plugins": []
    },
    "css": {
        "loaderOptions": {
            "postcss": {
                "config": {
                    "path": "./postcss.config.js"
                }
            }
        }
    },
    "transpileDependencies": [
        "vuetify"
    ]
}

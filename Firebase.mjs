export async function Firebase(config, basePath){
    const FB_CDN = 'https://www.gstatic.com/firebasejs/10.12.2/'
    const App = await import(FB_CDN + 'firebase-app.js')
    const DB = await import(FB_CDN + 'firebase-database.js')

    let app, db

    if (typeof config != 'object') return
    if (Object.keys(config) < 3) return

    try {
        app = App.initializeApp(config)
        db = DB.getDatabase(app)
        console.log('connected to firebase')
    } catch (e) {
        console.log(e)
        return
    }

    function initCollection(path, options){
        path = basePath ? basePath + path : path
        
        const onChange = options.onChange ?? function(){}
        const onChildAdded = options.onChildAdded ?? function(){}
        const onChildChanged = options.onChildChanged ?? function(){}
        const onChildRemoved = options.onChildRemoved ?? function(){} 

        const limit = options.limit ?? 100
        const onlyOnce = options.onlyOnce ?? true

        const collectionRef = DB.ref(db, path)
        const lastHistory = DB.query(collectionRef, DB.limitToLast(limit))

        DB.onValue(lastHistory, (snapshot) => {
            const values = {}
            snapshot.forEach((child) => {
                values[child.key] = child.val()
            })
            onChange(values)

        }, { onlyOnce })

        DB.onChildAdded(lastHistory, data => onChildAdded(data))
        DB.onChildChanged(lastHistory, data => onChildChanged(data))
        DB.onChildRemoved(lastHistory, data => onChildRemoved(data))

        function insert(key, data){
            const collectionRef = DB.ref(db, path + key)
            DB.set(collectionRef, data)
        }

        return { 
            path, limit, onlyOnce, insert 
        }
    }

    function initData(path, options){
        path = basePath ? basePath + path : path
        
        const onlyOnce = options.onlyOnce ?? false
        const onChange = options.onChange ?? function(){}

        const dataRef = DB.ref(db, path)

        let data
        DB.onValue(dataRef, (snapshot) => {
            data = snapshot.val()
            onChange(data)
        }, { onlyOnce })

        function get(){
            return data
        }
        function set(value){
            DB.set(dataRef, value)
        }

        return { path, get, set } 
    }

    return { config, initCollection, initData }
}
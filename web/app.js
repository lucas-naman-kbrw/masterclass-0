require('!!file-loader?name=[name].[ext]!./index.html')
/* required library for our React app */
var React = require("react")
var ReactDOM = require('react-dom')
var createReactClass = require('create-react-class')
var Qs = require('qs')
var Cookie = require('cookie')
var When = require('when')

/* required css for our application */
require('./webflow/css/accounts.css');
require('./webflow/css/modal.css');
require('./webflow/css/loadder.css');
require('./webflow/css/update.css');

var cn = function(){
  var args = arguments, classes = {}
  for (var i in args) {
    var arg = args[i]
    if(!arg) continue
    if ('string' === typeof arg || 'number' === typeof arg) {
      arg.split(" ").filter((c)=> c!="").map((c)=>{
        classes[c] = true
      })
    } else if ('object' === typeof arg) {
      for (var key in arg) classes[key] = arg[key]
    }
  }
  return Object.keys(classes).map((k)=> classes[k] && k || '').join(' ')
}

var XMLHttpRequest = require("xhr2")
var HTTP = new (function(){
  this.get = (url)=>this.req('GET',url)
  this.delete = (url)=>this.req('DELETE',url)
  this.post = (url,data)=>this.req('POST',url,data)
  this.put = (url,data)=>this.req('PUT',url,data)

  this.req = (method,url,data)=> new Promise((resolve, reject) => {
    var req = new XMLHttpRequest()
    req.open(method, url)
    req.responseType = "text"
    req.setRequestHeader("accept","application/json,*/*;0.8")
    req.setRequestHeader("content-type","application/json")
    req.setRequestHeader("key","zozo")
    req.onload = ()=>{
      if(req.status >= 200 && req.status < 300){
      resolve(req.responseText && JSON.parse(req.responseText))
      }else{
      reject({http_code: req.status})
      }
    }
  req.onerror = (err)=>{
    reject({http_code: req.status})
  }
  req.send(data && JSON.stringify(data))
  })
})()

function addRemoteProps(props){
  return new Promise((resolve, reject)=>{
    var remoteProps = Array.prototype.concat.apply([],
      props.handlerPath
        .map((c)=> c.remoteProps) // -> [[remoteProps.user], [remoteProps.orders], null]
        .filter((p)=> p) // -> [[remoteProps.user], [remoteProps.orders]]
    )
    var remoteProps = remoteProps
    .map((spec_fun)=> spec_fun(props) ) // -> 1st call [{url: '/api/me', prop: 'user'}, undefined]
                              // -> 2nd call [{url: '/api/me', prop: 'user'}, {url: '/api/orders?user_id=123', prop: 'orders'}]
    .filter((specs)=> specs) // get rid of undefined from remoteProps that don't match their dependencies
    .filter((specs)=> !props[specs.prop] ||  props[specs.prop].url != specs.url) // get rid of remoteProps already resolved with the url
    if(remoteProps.length == 0)
      return resolve(props)

    // check out https://github.com/cujojs/when/blob/master/docs/api.md#whenmap and https://github.com/cujojs/when/blob/master/docs/api.md#whenreduce
    var promise = When.map( // Returns a Promise that either on a list of resolved remoteProps, or on the rejected value by the first fetch who failed 
      remoteProps.map((spec)=>{ // Returns a list of Promises that resolve on list of resolved remoteProps ([{url: '/api/me', value: {name: 'Guillaume'}, prop: 'user'}])
        return HTTP.get(spec.url)
          .then((result)=>{spec.value = result; return spec}) // we want to keep the url in the value resolved by the promise here. spec = {url: '/api/me', value: {name: 'Guillaume'}, prop: 'user'} 
      })
    )
    When.reduce(promise, (acc, spec)=>{ // {url: '/api/me', value: {name: 'Guillaume'}, prop: 'user'}
      acc[spec.prop] = {url: spec.url, value: spec.value}
      return acc
    }, props).then((newProps)=>{
      addRemoteProps(newProps).then(resolve, reject)
    }, reject)
  })
}

var remoteProps = {
  user: (props)=>{
    return {
      url: "/api/me",
      prop: "user"
    }
  },
  accounts: (props)=>{
    var qs = {...props.qs}
    var query = Qs.stringify(qs)
    return {
      url: "/api/accounts" + (query == '' ? '' : '?' + query),
      prop: "accounts"
    }
  },
}

var Child = createReactClass({
  render(){
    var [ChildHandler,...rest] = this.props.handlerPath
    return <ChildHandler {...this.props} handlerPath={rest} />
  }
})

var Layout = createReactClass ({

  getInitialState: function() {
    return {
      modal: null,
      loader: false,
      update: false,
      add: null,
    };
  },


  modal(spec){
    this.setState({
      modal: {
        ...spec, callback: (res)=>{
          this.setState({modal: null},()=>{
            if(spec.callback) spec.callback(res)
          })
        }
      }
    })
  },

  loader(promise) {
    this.setState({loader: true});
    return promise.then(() => {
      this.setState({loader: false});
    })
  },

  update(spec){
    this.setState({
      update: {
        ...spec, callback: (res)=>{
          this.setState({update: null},()=>{
            if(spec.callback) spec.callback(res)
          })
        }
      }
    })
  },

  add(spec){
    this.setState({
      add: {
        ...spec, callback: (res)=>{
          this.setState({add: null},()=>{
            if(spec.callback) spec.callback(res)
          })
        }
      }
    })
  },

  search() {
    this.props.accounts = []
  },

  render(){
    var modal_component = {
      'delete': (props) => <DeleteModal {...props}/>,
      'update': (props) => <UpdateModal {...props} />,
      'add': (props) => <AddModal {...props} />
    }[this.state.modal && this.state.modal.type];
    modal_component = modal_component && modal_component(this.state.modal)

    var loader_component = this.state.loader && (() => <Loader />)
    loader_component = loader_component && loader_component(this.state.loader)


    var props = {
      ...this.props, modal: this.modal, loader: this.loader, add: this.add, search: this.search
    }

    return <JSXZ in="accounts" sel=".layout">
        <Z sel=".layout-container">
          <this.props.Child {...props}/>
        </Z>
        <Z sel=".modal-wrapper" className={cn(classNameZ, {'hidden': !modal_component})}>
          {modal_component}
        </Z>
        <Z sel=".loadder-wrapper" className={cn(classNameZ, {'hidden': !loader_component})}>
          {loader_component}
        </Z>

      </JSXZ>
  }
})

var Loader = createReactClass({
  render() {
    return <JSXZ in="loadder" sel=".loader">
    </JSXZ>
  }
})

var DeleteModal = createReactClass({
  render(){
    return <JSXZ in="modal" sel=".modal">
        <Z sel=".title">{ this.props.title }</Z>
        <Z sel=".message">{ this.props.message}</Z>
        <Z sel=".button-cancel" onClick={() => this.props.callback(false)}><ChildrenZ /></Z>
        <Z sel=".button-validate" onClick={() => this.props.callback(true)}><ChildrenZ /></Z>
    </JSXZ>
  }
})

var Header = createReactClass({
  render(){

    return <JSXZ in="accounts" sel=".header">
        <Z sel=".header-container">
          <this.props.Child {...this.props}/>
        </Z>
      </JSXZ>
  }
})

var UpdateModal = createReactClass({

  getInitialState: function() {
    return {
      firstName: this.props.account.first_name,
      lastName: this.props.account.last_name,
      balance: this.props.account.balance
    };
  },

  handleInputChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  },

  render() {
    return <JSXZ in="update" sel=".update">
        <Z sel=".account-title">{ this.props.title + " " + this.props.account.id }</Z>
        <Z sel=".last-name" name="lastName" value={ this.state.lastName } onChange={this.handleInputChange}></Z>
        <Z sel=".first-name" name="firstName" value={ this.state.firstName } onChange={this.handleInputChange}></Z>
        <Z sel=".update-balance" name="balance" value={ this.state.balance } onChange={this.handleInputChange}></Z>
        <Z sel=".cancel-update" onClick={() => this.props.callback(null)}><ChildrenZ /></Z>
        <Z sel=".submit-button" onClick={() => this.props.callback(this.state)}><ChildrenZ /></Z>
    </JSXZ>
  }
})

var AddModal = createReactClass({

  getInitialState: function() {
    return {
      firstName: "",
      lastName: "",
      balance: ""
    };
  },

  handleInputChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  },

  render() {
    return <JSXZ in="update" sel=".update">
        <Z sel=".account-title">{ this.props.title }</Z>
        <Z sel=".last-name" name="lastName" value={ this.state.lastName } onChange={this.handleInputChange}></Z>
        <Z sel=".first-name" name="firstName" value={ this.state.firstName } onChange={this.handleInputChange}></Z>
        <Z sel=".update-balance" name="balance" value={ this.state.balance } onChange={this.handleInputChange}></Z>
        <Z sel=".cancel-update" onClick={() => this.props.callback(null)}><ChildrenZ /></Z>
        <Z sel=".submit-button" onClick={() => this.props.callback(this.state)}><ChildrenZ /></Z>
    </JSXZ>
  }
})

var SearchForm = createReactClass({

  getInitialState: function() {
    return {
      word: "",
    };
  },

  handleInputChange(event) {

    this.setState({
      word: event.target.value
    });
  },

  search () {
    this.props.update_table(this.state.word)
  },

  render () {
    return <JSXZ in="accounts" sel=".search-block">
        <Z sel=".input-search" onChange={this.handleInputChange}></Z>
        <Z sel=".search-button" type="" onClick={ () => this.search() }></Z>
    </JSXZ>
  }
})

var Accounts = createReactClass({
  statics: {
    remoteProps: [remoteProps.accounts]
  },

  getInitialState: function() {
    console.log(this.props.accounts)
    return {
      accounts: this.props.accounts.value.slice(0)
    };
  },

  update (account) {
    this.props.modal({
      type: 'update',
      title: 'Update Account',
      account: account,
      callback: (value)=>{
        if (value) {
          this.props.loader(
            HTTP.put('/api/account/' + account.id, {
              "last_name": value.lastName,
              "first_name": value.firstName,
              "balance": value.balance
            })
          ).then(() => {
            delete browserState.accounts;
            onPathChange();
          })
        }
      }
    })
  },

  modal (id) {

    this.props.modal({
      type: 'delete',
      title: 'Order deletion',
      message: `Are you sure you want to delete this ?`,
      callback: (value)=>{
        if (value) {
          this.props.loader(
              HTTP.delete('/api/account/' + id)
            ).then(() => {
              delete browserState.accounts;
              onPathChange();
            })
        }
      }
    })  
  },

  add () {
    this.props.modal({
      type: 'add',
      title: 'Add Account',
      callback: (value)=>{
        if (value) {
          this.props.loader(
            HTTP.post('/api/account', {
              "last_name": value.lastName,
              "first_name": value.firstName,
              "balance": value.balance
            })
          ).then(() => {
            delete browserState.accounts;
            onPathChange();
          })
        }
      }
    })
  },

  myUpdate(word) {
    if (word == "") {
      var accounts = this.props.accounts.value
    } else {
      var accounts = this.props.accounts.value.filter(account => account.last_name.includes(word))
    }
    this.setState({accounts : accounts})
  },

  render(){
    var props = {...this.props, update_table: this.myUpdate}
    return <JSXZ in="accounts" sel=".container">
      <Z in="accounts" sel=".button-add" onClick={() => this.add()}><ChildrenZ/></Z>
      <Z in="accounts" sel=".search-div">
        <SearchForm {...props} />
      </Z>
      <Z in="accounts" sel=".table-body">
        {
          this.state.accounts.map((account, i) => (<JSXZ key={i} in="accounts" sel=".line-1">
            <Z sel=".id">{account.id}</Z>
            <Z sel=".last-name">{account.last_name}</Z>
            <Z sel=".first-name">{account.first_name}</Z>
            <Z sel=".balance">{account.balance}</Z>
            <Z sel=".last-update">{account.last_update}</Z>
            <Z sel=".div-block" onClick={() => this.update(account)}><ChildrenZ/></Z>
            <Z sel=".trash" onClick={() => this.modal(account.id)}><ChildrenZ /></Z>
          </JSXZ>))
        }
     </Z>
    </JSXZ>
  }
})

var routes = {
  "accounts": {
    path: (params) => {
      return "/";
    },
    match: (path, qs) => {
      return (path == "/") && {handlerPath: [Layout, Header, Accounts]}
    }
  },
}

var browserState = {Child: Child}

function onPathChange() {
  var path = location.pathname
  var qs = Qs.parse(location.search.slice(1))
  var cookies = Cookie.parse(document.cookie)

  var route, routeProps
  //We try to match the requested path to one our our routes
  for(var key in routes) {
    routeProps = routes[key].match(path, qs)
    if(routeProps){
        route = key
          break;
    }
  }
  browserState = {
    ...browserState,
    ...routeProps,
    route: route
  }
  addRemoteProps(browserState).then(
    (props) => {
      browserState = props
      //Log our new browserState
      //Render our components using our remote data
      ReactDOM.render(<Child {...browserState}/>, document.getElementById('root'))
    }, (res) => {
      ReactDOM.render(<ErrorPage message={"Shit happened"} code={res.http_code}/>, document.getElementById('root'))
    })
}

window.addEventListener("popstate", ()=>{ onPathChange() })
onPathChange()
import React from 'react'
import ReactDOM from 'react-dom'
// import Web3 from 'web3'
import Web3 from 'aion-web3'
import './../css/index.css'
import casinoJSON from './../../build/contracts/Casino.json'

// console.log(casinoJSON);
let web3;
let myContract;
let account = "hello";
function injectWeb3() {
    // Is there an injected web3 instance?
    if (window.aionweb3) { // AIWA Chrome extension will inject automatically
        console.log("Using web3 detected from external source like AIWA")
        console.log("✓ AIWA injected successfully");
        console.log("update plkk");
        // this.web3 = new Web3(web3.currentProvider);
        web3 = new Web3(window.aionweb3.currentProvider);
        // web3 = new Web3(new Web3.providers.HttpProvider("https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=b07fca69798743afbfc1e88e56e9af9d"));

        // console.log("wtf", new Web3(window.aionweb3.currentProvider));
        // console.log(web3);
        myContract = new web3.eth.Contract(casinoJSON.info.abiDefinition, "0xa01ebcef760Bc93c9EF066632e2083548357F936B6E42879380a4433F1e45d2c");
        console.log(myContract);
        account = window.aionweb3.eth.accounts;
    }
    // else {
    //   // If no injected web3 instance is detected, fall back to Nodesmith Mastery Testnet
    //   // fallback is fine for development environments, but insecure ant not suitable for production
    //   // INJECT NODESMITH
    //   console.log("No web3 detected. Falling back to Nodesmith Mastery Testnet. Consider switching to AIWA for development.");
    //   web3 = new Web3(new Web3.providers.HttpProvider("https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=b07fca69798743afbfc1e88e56e9af9d"));
    //   console.log(window.aionweb3);
    // }
}

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            lastWinner: 0,
            numberOfBets: 0,
            minimumBet: 0,
            totalBet: 0,
            maxAmountOfBets: 0,
            accounts: account
        }
        window.a = this.state
        this.updateState = this.updateState.bind(this)
    }

    componentDidMount() {
        setTimeout(function () {
            // alert("Hello");
            console.log(window.aionweb3);
            injectWeb3();
            this.updateState()
        }.bind(this), 2000);

        // this.setupListeners()
        // setInterval(this.updateState.bind(this), 7e3)
    }

    updateState() {
      console.log('updateState hit');

      // update mininum bet value
      // using the promise
      myContract.methods.minimumBet().call({})
      .then(function(result){
          console.log('min bet', result);
          this.setState({
            minimumBet: result
          })
      }.bind(this));

      // update total amount in bets
      // using the promise
      myContract.methods.totalBet().call({})
      .then(function(result){
          console.log('total bet', result);
          this.setState({
            totalBet: result
          })
      }.bind(this));

      // update numberOfBets
      // using the promise
      myContract.methods.numberOfBets().call({})
      .then(function(result){
          console.log('number of bets', result);
          this.setState({
            numberOfBets: result
          })
      }.bind(this));

      // update maximum amount of bets
      // using the promise
      myContract.methods.maxAmountOfBets().call({})
      .then(function(result){
          console.log('maxAmountOfBets', result);
          this.setState({
            maxAmountOfBets: result
          })
      }.bind(this));
    }

    // Listen for events and executes the voteNumber method
    setupListeners() {
        let liNodes = this.refs.numbers.querySelectorAll('li')
        liNodes.forEach(number => {
            number.addEventListener('click', event => {
                event.target.className = 'number-selected'
                this.voteNumber(parseInt(event.target.innerHTML), done => {

                    // Remove the other number selected
                    for (let i = 0; i < liNodes.length; i++) {
                        liNodes[i].className = ''
                    }
                })
            })
        })
    }

    voteNumber(number, cb) {
        let bet = this.refs['ether-bet'].value

        if (!bet) bet = 0.1

        if (parseFloat(bet) < this.state.minimumBet) {
            alert('You must bet more than the minimum')
            cb()
        } else {
            myContract.bet(number, {
                gas: 300000,
                from: web3.eth.accounts[0],
                value: web3.toWei(bet, 'ether')
            }, (err, result) => {
                cb()
            })
        }
    }

    render() {
        return (
            <div className="main-container">
                <h1>Pick the luckiest member of Aion Foundation and win AION coins 🚀</h1>

                <div className="block">
                    <b>Number of bets so far:</b> &nbsp;
               <span>{this.state.numberOfBets}</span>
                </div>

                <div className="block">
                    <b>Last winning number:</b> &nbsp;
               <span>{this.state.lastWinner}</span>
                </div>

                <div className="block">
                    <b>Total AION pool:</b> &nbsp;
               <span>{this.state.totalBet} AION</span>
                </div>

                <div className="block">
                    <b>Minimum bet:</b> &nbsp;
               <span>{this.state.minimumBet} AION</span>
                </div>

                <div className="block">
                    <b>Max amount of bets:</b> &nbsp;
               <span>{this.state.maxAmountOfBets}</span>
                </div>

                <hr />

                <h2>Vote for the next randomly selected teammate, at 10 bets a payout event will occur. If you selected right you will receive the pot.</h2>

                <label>
                    <b>How much AION do you want to bet? <input className="bet-input" ref="ether-bet" type="number" placeholder={this.state.minimumBet} /></b> AION
               <br />
                </label>

                <ul ref="numbers">
                    <li><img width="130px" height="130px" src="https://aion.network/media/Jeff-e1526052554495-300x288.jpg" /></li>
                    <li><img width="130px" height="130px" src="https://aion.network/media/Edit-9900-e1538349709269-275x300.jpg" /></li>
                    <li><img width="130px" height="130px" src="https://aion.network/media/Matt-e1525972764837-286x300.jpg" /></li>
                    <li><img width="130px" height="130px" src="https://aion.network/media/Yulong-e1525972245734-300x300.jpg" /></li>
                    <li><img width="130px" height="130px" src="https://aion.network/media/aion-team-rohan.jpg" /></li>
                    <li><img width="130px" height="130px" src="https://aion.network/media/Kelvin-Lam-300x253.jpg" /></li>
                    <li><img width="130px" height="130px" src="https://aion.network/media/Kim-hires-2_edit-e1526002633127-289x300.jpg" /></li>
                    <li><img width="130px" height="130px" src="https://aion.network/media/Nick-e1528488297820-293x300.jpg" /></li>
                    <li><img width="130px" height="130px" src="https://aion.network/media/JenniZhang_Edit-9865-e1538349973408-265x300.jpg" /></li>
                    <li><img width="130px" height="130px" src="https://aion.network/media/Mike-Mason-e1530296023825-292x300.jpg" /></li>
                </ul>

                <hr />

                <div><i>Only working with the Mastery Test Network 📡</i></div>
                <div><i>You can only vote once per account</i></div>
                <div><i>Your account is <strong>{account}</strong></i></div>
                <div><i>Your vote will be reflected when the next block is mined.</i></div>
            </div>
        )
    }
}

ReactDOM.render(
    <App />,
    document.querySelector('#root')
)

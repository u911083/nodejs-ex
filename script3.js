var Client = require('node-rest-client').Client;
var Promise = require('promise');
var client = new Client();
var primeDiceKey = '3b520540-7b7f-4f95-bd64-c3704edc2bf2';

const stearnBets = [1, 1, 1, 2, 2, 4, 4, 8, 8, 16, 16, 32, 32, 64, 64, 128, 128, 256, 256, 512, 512, 1024, 1024, 2048, 2048, 
					4096, 4096, 8192, 8192, 16384, 16384, 32768, 32768, 65536, 65536, 131072, 131072, 262144, 262144]; //, 524288, 524288

var loses = 0;
var winReset = false;
var logChain = "";
var user = {   name: null,    
 				balance: 0 };

var profit;

let betting;

function autoBet(multiplier) {    
 	if (!multiplier) {
 	    multiplier = 1;    
 	}    

 	logChain = "";    
 	loses = 0;    
 	profit = 0;    

 	var busy = false;    
 	betting = setInterval(() => {        
 		if (!busy) {            
 			busy = true;            
 			const currentBet = stearnBets[loses] * multiplier;            
 			bet(currentBet).then((win) => {                
 			const preLog = `Bet Amount: ${currentBet} || Balance: ${user.balance}` + (profit != null ? ` || Profit: ${profit} ` : '') + (win ? '(WIN)' : '(LOSE)');                

 			logChain += preLog + "\n";                
 			console.log(preLog);                

 			if (!win) {                    
 				winReset = false;                    
 				loses++;                
 			} else if (win && !winReset && loses > 0) {                    
 				winReset = true;                
 			} else if (win && winReset) {                    
 				loses = 0;                    
 				winReset = false;                
 			}                

 			busy = false;            
 			})        
 		}    
 	}, 500);
 }

function getUser() {
    return new Promise((success, reject) => {
        client.get(`https://api.primedice.com/api/users/1?api_key=${primeDiceKey}`, 
        (data, resp) => {            
            if (data) {                
            	user = {                    
            		name: data.user.username,                    
            		balance: data.user.balance                
            	};                
            	success()            
            } else {                
            	reject('something went wrong');            
            }        
     	});    
     });
 }

function bet(amount) {    
	var randomizer = Math.round((Math.random() + 1)) - 1;    
	var betArgs = [
		{        
			data: {
				amount: amount,            
				target: 50.49,            
				condition: ">"        
			},        
			headers: { "Content-Type": "application/json" }    
		}, {        
			data: {            
				amount: amount,            
				target: 49.50,            
				condition: "<"        
			},        
			headers: { "Content-Type": "application/json" }    
		}
	];    

	return new Promise((success, reject) => {        
		client.post(`https://api.primedice.com/api/bet?api_key=${primeDiceKey}`, 
			betArgs[randomizer], (data, resp) => {            
				if (data.bet) {                
					if (!profit) {                    
						profit = 0;                
					}                
					profit += data.bet.profit;                
					user.balance = data.user.balance;                
					success(data.bet.profit > 0)            
				} else {                
					reject('something went wrong');            
				}        
			});    
	});
}

getUser().then(() => {    
	try {        
		autoBet(7);    
	} catch (e) {        
		console.log(e);        
		logChain += JSON.stringify(e);        
		saveLog(logChain);        
		process.exit();    
	}
})

process.on('SIGTERM', function () {    // clean up    
	clearInterval(betting);    
	console.log("==STOPPING SYSTEM (a last bet might occur)==");    
	setTimeout(() => {        
		process.exit();    
	}, 1000);
});
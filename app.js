const Discord = require('discord.js');
var fs = require('fs');
const sniperbot = new Discord.Client();

const dailyInterval = 86400000;
const prefix = "/";

var balancedata = fs.readFileSync("balances.json");
var balances = JSON.parse(balancedata);

var costdata = fs.readFileSync("costs.json");
var costs = JSON.parse(costdata);

var dailydata = fs.readFileSync("daily.json");
var daily = JSON.parse(dailydata);

var strikedata = fs.readFileSync("strikes.json");
var strikes = JSON.parse(strikedata);

var timestampdata = fs.readFileSync("timestamps.json");
var timestamps = JSON.parse(timestampdata);

var makingChannel;
var makingUser;

function getPermissions(message) {
	var staffrole = message.guild.roles.find("name","Staff");
	var adminrole = message.guild.roles.find("name", "Administrator");
	var ownerrole = message.guild.roles.find("name", "Owner");

	var user = message.member;

	if(user.roles.has(ownerrole.id)){
		return 3;
	}
	if(user.roles.has(adminrole.id)){
		return 2;
	}
	if(user.roles.has(staffrole.id)){
		return 1;
	}
	return 0;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var r = 0; r < 6; r++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getNextMidnight(){
	var now = Date().now();
	var last = timestamps["midTag"];
	while(last<now){
		last += dailyInterval;
	}
	return last;
}

function midnightSetup(){
	timestamps["midTag"] = getNextMidnight();
	console.log(timestamps["midTag"], Date().getTime());
	updateTimestamps();
}

function isNumber(n){
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function inBalances(user){
	if (user in balances){
  			balances[user] += 0;
  		}
  		else{
  			balances[user] = 0;
  		}
}

function addQP(user, amount){
	inBalances(user);
	balances[user]+=amount;
	updateBalance();
}

function reduceQP(user, amount){
	inBalances(user);
	balances[user]-=amount;
	if(balances[user]<0){
		balances[user] = 0;
	}
	updateBalance();
}

function investIter(amount){
	timestamps["purchases"] = true;
	for(key in investments){
		investments[key]["value"]+=amount;
	}
	updateInvestments();
}

function investCheck(){

}

function personalChannel(message,type){
	if(timestamps["chanLock"]){
		return true;
	}
	timestamps["chanLock"] = true;

	var name = message.author.username;
	var server = message.guild;
	var roles = server.roles;

	makingChannel = name.toLowerCase();
	makingUser = message.author;

	server.createChannel(name,type);
}
	

function updateBalance(){
	var data = JSON.stringify(balances);
	fs.writeFile("balances.json",data,finished);
	function finished(err){
		if(err){
			console.log(err);
		}
		else{
			console.log("balances.json updated");
		}
	}
}

function updateStrikes(){
	var data = JSON.stringify(strikes);
	fs.writeFile("strikes.json",data,finished);
	function finished(err){
		if(err){
			console.log(err);
		}
		else{
			console.log("strikes.json updated");
		}
	}
}

function updateCosts(){
	var data = JSON.stringify(costs);
	fs.writeFile("costs.json",data,finished);
	function finished(err){
		if(err){
			console.log(err);
		}
		else{
			console.log("costs.json updated");
		}
	}
}

function updateDaily(){
  var data = JSON.stringify(daily);
  fs.writeFile("daily.json",data,finished);
  function finished(err){
    if(err){
      console.log(err);
    }
    else{
      console.log("daily.json updated");
    }
  }
}

function updateInvestments(){
	var data = JSON.stringify(investments);
	fs.writeFile("investments.json",data,finished);
	function finished(err){
		if(err){
			console.log(err);
		}
		else{
			console.log("investments.json updated");
		}
	}
}

function updateTimestamps(){
	var data = JSON.stringify(timestamps);
	fs.writeFile("timestamps.json",data,finished);
	function finished(err){
		if(err){
			console.log(err);
		}
		else{
			console.log("timestamps.json updated");
		}
	}
}

function inDaily(user){
	if (user in daily){
  			return;
  		}
  		else{
  			daily[user] = false;
  		}
}

function dailyIteration(){
	for(key in daily){
    daily[key]=false;
  }
  updateDaily();
}

//Above are utility functions
//
//
//
//Below are the .on alerts. sniperbot.on(message) is where all the commands will be coded.

sniperbot.on('ready', () => {

	setInterval(function(){
		if(timestamps['rainbow']){
			var server = sniperbot.guilds.find("name", "Bot Debugging");
			var role = server.roles.find("name", "Rainbow");
			role.setColor(getRandomColor()).then(r=>console.log('${r} had color set')).catch(console.error);
		}
		var now = Date.now();
		if(now>timestamps["midTag"]){
			timestamps["midTag"]+=dailyInterval;
			dailyIteration();
		}
	},10000);

  	console.log('I am ready!');
});

sniperbot.on('channelCreate', channel =>{
	if(channel.name != makingChannel){
		return;
	}
	makingChannel='';
	var id = makingUser.id;

	var role = channel.guild.roles.find("name", "Test");

	channel.overwritePermissions(makingUser,{
		'MANAGE_CHANNELS': true,
		'MANAGE_ROLES': true,
		'READ_MESSAGES': true
	});

	var everyone = channel.guild.roles.find("name", "@everyone");

	channel.overwritePermissions(everyone,{
		"READ_MESSAGES": false
	});

	makingUser = null;
	timestamps["chanLock"] = false;

});

sniperbot.on('message', message => {
	if(message.author.bot) return;		//Bot will not react to other bots
	if(!message.content.startsWith(prefix)) return;	//Stops checking for commands if no prefix

	let command = message.content.split(" ")[0];
	command = command.slice(prefix.length).toLowerCase();

	let argstring = message.content.split(" ").slice(1);
	var args = [];
	for (argument in argstring){
		if (argstring[argument] === ''){

		}
		else{
			args.push(argstring[argument]);
		}
	}

	var permission = getPermissions(message);

/*
	Each if statement below here should have returns in it so that the bot does not run more code than neccessary with each command.
	
*/

	if (command === "say"){
		let speech = args.join(" ");
		message.channel.sendMessage(speech);
		return;
	}

  	if (command === "ping"){
  		message.channel.sendMessage("pong");
  		return;
  	}

  	if (command === "balance"){
  		if (args.length===0){
  			var user = message.author;
  		}
  		else{
  			var user = args[0];
  		}

  		inBalances(user);

  		message.channel.sendMessage("The balance of "+user+ " is "+balances[user]+" QP.");
  		return;
  	}

  	if (command === "addqp"){
  		if(permission<2){
  			message.channel.sendMessage("You do not have permission to use that command");
  			return;
  		}
  		if (args.length != 2){
  			message.channel.sendMessage('Use "/addQP <@user> <amount>');
  			return;
  		}
  		var user = args[0];
  		var value = args[1];

  		if (isNumber(value)){
  			value = parseInt(value);
		}
		else{
			message.channel.sendMessage('Use "/addQP <@user> <amount>');
			return;
		}

		addQP(user,value);

		message.channel.sendMessage(user+" now has a balance of "+balances[user]+" QP");
		
		return;
  	}

  	if (command == "takeqp"){
  		if(permission<2){
  			message.channel.sendMessage("You do not have permission to use that command");
  			return;
  		}
  		if (args.length != 2){
  			message.channel.sendMessage('Use "/takeQP <@user> <amount>');
  			return;
  		}
  		var user = args[0];
  		var value = args[1];

  		if (isNumber(value)){
  		value = parseInt(value);
		}
		else{
			message.channel.sendMessage('Use "/takeQP <@user> <amount>');
			return;
		}

		reduceQP(user,value);

		message.channel.sendMessage(user+" now has a balance of "+balances[user]+" QP");
		
		return;
  	}

  	if (command === "daily"){
  		var user = message.author;
  		inDaily(user);
  		if(daily[user]){
  			message.channel.sendMessage("You have already collected your daily QP.");
  		}
  		else{
  			daily[user] = true;
  			addQP(user, 100);
  			message.channel.sendMessage("You have collected 100 QP. You now have a balance of "+balances[user]+" QP");
  		}
      updateDaily();
  	}

  	if (command==="buy"){
  		if(args.length<1){
  			return;
  		}
  		var purchase = args[0].toLowerCase();
  		if(purchase==="channel"){
  			var user = message.member;
  			var type = "text";
  			inBalances(user);
  			if(balances[user]>costs["channel"]){
  				if(personalChannel(message,type)){
  					message.channel.sendMessage("Global Variable Lock Error. Wow, I never thought this would actually happen. Congrats. Have 5000 QP and try again in literally like 0.01 seconds.");
  					addQP(user,5000);
  					return;
  				}
  				else{
  					balances[user]-=costs["channel"];
  					message.channel.sendMessage("Purchase sucessful. "+costs["channel"]+" QP has been deducted from your balance.");
  					investIter(costs["channel"]);
  				}
  			}
  			else{
  				message.channel.sendMessage("You cannot afford a channel");
  			}		
  		}
  		else if(purchase === "voicechat"){
  			message.channel.sendMessage("Not available at this time.");
  			return;
  			var user = message.member;
  			var type = "voice";
  			inBalances(user);
  			if(balances[user]>costs["voicechat"]){
  				if(personalChannel(message,type)){
  					message.channel.sendMessage("Global Variable Lock Error. Wow, I never thought this would actually happen. Congrats. Have 5000 QP and try again in literally like 0.01 seconds.");
  					addQP(user,5000);
  					return;
  				}
  				else{
  					balances[user]-=costs["channel"];
  					investIter(costs["channel"]);
  				}
  			}
  			else{
  				message.channel.sendMessage("You cannot afford a voice channel");
  			}
  		}
  		/*else if(purchase in costs){
  			var rolename = purchase.charAt(0).toUpperCase()+purchase.slice(1);
  			var roletogive = message.guild.roles.find("name", rolename);
  			var user = message.member;

  			if (user.roles.has(roletogive.id)){
  				message.channel.sendMessage("You already have that role.");
  				return;
  			}

  			inBalances(user);
  			if(balances[user]>costs[purchase]){
  				reduceQP(user,costs[purchase]);
  				user.addRole(roletogive);
  				investIter(costs[purchase]);
  				message.channel.sendMessage("You have purchased the "+rolename+" role");
  			}
  			else{
  				message.channel.sendMessage("You cannot afford that role.");
  			}
  		}*/
  		else{
  			message.channel.sendMessage("That is not something you can buy.");
  		}
  		return;
  	}

  	if (command === "give"){
  		var giver = message.member;
  		if(args.length!=2){
  			message.channel.sendMessage('Use "/give <@user> <amount>"');
  			return;
  		}
  		var reciever = args[0];
  		var amount = args[1];

		if (isNumber(amount)){
  			amount = parseInt(amount);
		}
		else{
			message.channel.sendMessage('Use "/give <@user> <amount>"');
			return;
		}

		if(balances[giver]<amount){
			message.channel.sendMessage("You do not have that many QP.");
			return;
		}

		addQP(reciever,amount);
		reduceQP(giver,amount);

		message.channel.sendMessage(giver+" has given "+amount+" QP to "+reciever);
		
		return;
  	}

  	if (command==="strike"){
  		if(permission<1){
  			message.channel.sendMessage("You do not have permission to use that command.");
  			return;
  		}
  		if(args.length!=1){
  			message.channel.sendMessage('Use "/strike <@user>"');
  			return;
  		}
  		var user = args[0];
  		if(user in strikes){
  			strikes[user]+=1;
  		}
  		else{
  			strikes[user]=1;
  		}
  		message.channel.sendMessage(user+" now has "+strikes[user]+" strikes.");
  		updateStrikes();

      if(strikes[user]==3){
        user.ban();
        message.channel.sendMessage(user+" has reached 3 strikes and been banned.");
      }
  		return;
  	}

  	if (command==="clearstrikes"){
  		if(permission<1){
  			message.channel.sendMessage("You do not have permission to use that command");
  			return;
  		}
  		if(args.length!=2){
  			message.channel.sendMessage('Use "/clearstrikes <@user> <number>');
  			return;
  		}
  		var user = args[0];
  		var amount = args[1];
  		if(isNumber(amount)){
  			amount = parseInt(amount);
  		}
  		else{
  			message.channel.sendMessage('Use "/clearstrikes <@user> <number>');
  			return;
  		}
  		if(amount<0){
  			message.channel.sendMessage("Cannot clear negative strikes");
  			return;
  		}
  		strikes[user] -= amount;
  		if(strikes[user]<0){
  			strikes[user]=0;
  		}
  		message.channel.sendMessage(user + " now has "+ strikes[user] +" strikes.");
  		updateStrikes();
  		return;
  	}

  	if (command==="seestrikes"){
  		if(args.length!=1){
  			message.channel.sendMessage('Use "/seestrikes <@user>"');
  			return;
  		}
  		var user = args[0];
  		if(user in strikes){
  			message.channel.sendMessage(user+" has "+strikes[user]+" strikes.");
  		}
  		else{
  			strikes[user] = 0;
  			message.channel.sendMessage(user+" has 0 strikes.");
  		}
  		return;
  	}

  	/*if (command === "sellrole"){
  		if(permission<2){
  			message.channel.sendMessage("You do not have permission to use that command");
  			return;
  		}
  		if(args.length!=2){
  			message.channel.sendMessage('Use "/sellrole <rolename> <cost>"');
  			return;
  		}
  		var rolename = args[0];
  		var cost = args[1];
  		var roletosell = message.guild.roles.find("name", rolename);
  		if(roletosell === null){
  			message.channel.sendMessage("Please choose a role that exists");
  			return;
  		}
  		if(isNumber(cost)){
  			cost = parseInt(cost);
  		}
  		else{
  			message.channel.sendMessage('Use "/sellrole <rolename> <cost>"');
  			return;
  		}
  		costs[rolename.toLowerCase()] = cost;
  		updateCosts();
  		return;
  	}

  	if (command === "invest"){
  		if(args.length!=1){
  			message.channel.sendMessage('Use "/invest <amount>"');
  			return;
  		}
  		var amount = args[0];
  		var user = message.member;
  		inBalances(user);

  		if(isNumber(amount)){
  			amount = parseInt(amount);
  			if(amount<1000){
  				message.channel.sendMessage("Pick a valid amount to invest. Must be 1000QP or greater.");
  				return;
  			}
  		}
  		else{
  			message.channel.sendMessage('Use "/invest <amount>"');
  			return;
  		}

  		if(user in investments){
  			message.channel.sendMessage("You already have an investment.");
  			return
  		}

  		if(balances[user]>amount){
  			var expiry = Date.now() + (4*dailyInterval);
  			investments[user] = {"value":amount,"expiry":expiry};
  			reduceQP(user,amount);
  			message.channel.sendMessage("You have invested "+amount+" QP.");
  		}
  		else{
  			message.channel.sendMessage("You do not have enough QP to invest that much.");
  			return;
  		}
  		updateInvestments();
  		return;
  	}*/

  	if (command === "rainbow"){
  		if(permission<2){
  			message.channel.sendMessage("You do not have permission to use that command");
  			return;
  		}
  		if(args.length!=1){
  			message.channel.sendMessage('Please use "/rainbow on" or "/rainbow off".');
  			return;
  		}
  		var val = args[0].toLowerCase();
  		if(val === "on"){
  			timestamps["rainbow"]=true;
  		}
  		if(val === "off"){
  			timestamps["rainbow"]=false;
  		}
  		updateTimestamps();
  		return;
  	}

  	if (command === "check"){
  		message.channel.sendMessage(user+" "+getPermissions(message));
  	}

});

//This makes sure that new members will get their Daily points without having to check their balance first.
sniperbot.on("guildMemberAdd", member =>{
	inBalances(member);
});

sniperbot.login('MzIwNzE1NzY3OTEyMDcxMTY5.DBThWQ._MJbDpHR9cLnEHZi6BPj2ok7yFw');
// TODO this could probbably be reworked into cleaner OO code
var Database = function(callback){
    this.databaseError = function(err){
        console.log(err.message);
		error(err.message);
	}
    this.db = openDatabase("accountInfo", "1.0", "User Account Info", 20000);
    this.db.transaction(function(tx){
        tx.executeSql("CREATE TABLE IF NOT EXISTS users (email, pass, defaultAccount boolean)");
        tx.executeSql("CREATE TABLE IF NOT EXISTS addresses (id AUTO_INCREMENT PRIMARY_KEY, place, defaultAddress boolean, user)");
    }, this.databaseError, callback);
	
	this.storeAccount = function(email, pass, defaultAccount){
		this.db.transaction(function(tx){
			tx.executeSql("INSERT INTO users (email, pass, defaultAccount) VALUES (?, ?, ?)", [email, pass, defaultAccount], function(tx, results){
				console.log(tx, results);
			}, this.databaseError);
			tx.executeSql("SELECT * FROM users", [], function(tx, results){console.log(results)}, function(err){console.log(err.messsage)});
		}, this.databaseError);
	};
	
	this.getAccounts = function(callback){
		this.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM users", [], callback, this.databaseError)
		}, this.databaseError);
	};
	
	this.setDefaultAccount = function(email){
		this.db.transaction(function(tx){
			tx.executeSql("UPDATE users SET defaultAccount = 'false'");
			tx.executeSql("UPDATE users SET defaultAccount = 'true' WHERE email = ?", [email])
		});
	};
	
	this.getDefaultAccount = function(callback){
		this.db.transaction(function(tx){
			console.log("called");
			tx.executeSql("SELECT * FROM users WHERE defaultAccount = 'true'", [], callback, this.databaseError);
			console.log("end");
		}, this.databaseError);
	};
	
	this.storeAddress = function(place, defaultAddress, user, callback){
		this.db.transaction(function(tx){
			tx.executeSql("INSERT INTO addresses (place, defaultAddress, user) VALUES (?, ?)", [JSON.stringify(place), defaultAddress, user]);
		}, this.databaseError, callback);
	};
	
	this.getDefaultAddress = function(callback){
		this.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM addresses WHERE defaultAccount = 'true'", [], callback, this.databaseError);
		}, this.databaseError);
	};
	
	this.getAllAddresses = function(user, callback){
		this.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM addresses", [], callback, this.databaseError);
		}, this.databaseError);
	};
	
	this.setDefaultAddress = function(id){
		this.db.transaction(function(tx){
			tx.executeSql("UPDATE addresses SET defaultAccount = 'false'");
			tx.executeSql("UPDATE addresses SET defaultAccount = 'true' WHERE id = ?", [id]);
		}, this.databaseError);
	};
}

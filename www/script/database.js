// TODO this could probbably be reworked into cleaner OO code
var Database = function(callback){
    this.databaseError = function(err){
        console.log(err.message);
		error(err.message);
	}
    this.db = openDatabase("accountInfo", "1.0", "User Account Info", 20000);
    this.db.transaction(function(tx){
        tx.executeSql("CREATE TABLE IF NOT EXISTS users (email, pass, first_name, last_name, defaultAccount boolean)");
        tx.executeSql("CREATE TABLE IF NOT EXISTS addresses (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, street, street2, city, zip, state, phone, nick, defaultAddress boolean, user)");
        tx.executeSql("CREATE TABLE IF NOT EXISTS creditCards (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, type, name, number, cvc, expiry, bill_addr, bill_addr2, bill_city, bill_state, bill_zip, defaultCard, user)");
    }, this.databaseError, callback);
	
	this.storeAccount = function(email, pass, first_name, last_name, defaultAccount){
    var store = arguments;
		this.db.transaction(function(tx){
      console.log("perfroming sql query");
			tx.executeSql("INSERT INTO users (email, pass, first_name, last_name, defaultAccount) VALUES (?, ?, ?, ?, ?)", store, null, this.databaseError);
			tx.executeSql("SELECT * FROM users", [], function(tx, results){console.log(results)}, function(err){console.log(err.messsage)});
		}, this.databaseError);
	};

  this.updateAccount = function(oldEmail, email, pass){
      this.db.transaction(function(tx){
        tx.executeSql("UPDATE users SET email = ?, pass = ? WHERE email = ?", [email, pass, oldEmail], null, this.databaseError);
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
			tx.executeSql("SELECT * FROM users WHERE defaultAccount = 'true'", [], callback, this.databaseError);
		}, this.databaseError);
	};
	
	this.storeAddress = function(street, street2, city, zip, state, phone, nick, defaultAddress, user, callback){
		this.db.transaction(function(tx){
			tx.executeSql("INSERT INTO addresses (street, street2, city, zip, state, phone, nick, defaultAddress, user) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [street, street2, city, zip, state,  phone, nick,  defaultAddress, user], callback);
		}, this.databaseError);
	};
	
	this.getDefaultAddress = function(email, callback){
		this.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM addresses WHERE defaultAddress = 'true' AND user = ?", [email], callback, this.databaseError);
		}, this.databaseError);
	};
	
	this.getAllAddresses = function(user, callback){
		this.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM addresses", [], callback, this.databaseError);
		}, this.databaseError);
	};

  this.getAddressById = function(id, callback){
    this.db.transaction(function(tx){
      tx.executeSql("SELECT * FROM addresses WHERE id = ?", [id], callback, this.databaseError);
    }, this.databaseError);
  };
	
	this.setDefaultAddress = function(id){
		this.db.transaction(function(tx){
			tx.executeSql("UPDATE addresses SET defaultAccount = 'false'");
			tx.executeSql("UPDATE addresses SET defaultAccount = 'true' WHERE id = ?", [id]);
		}, this.databaseError);
	};

  this.updateAddress = function(id, street, city, state, zip, phone, email){
    this.db.transaction(function(tx){
      tx.executeSql("UPDATE addresses SET street = ?, city = ?, state = ?, zip = ?, phone = ?, user = ? WHERE id = ?", [street, city, state, zip, phone, email, id], null, this.databaseError);
    }, this.databaseError);
  };

  this.storeCreditCard = function(type, name, number, cvc, expiry, addr, addr2, city, state, zipi, defaultCard, user){
    var store = arguments;
    this.db.transaction(function(tx){
      tx.executeSql("INSERT INTO creditCards (type, name, number, cvc, expiry, bill_addr, bill_addr2, bill_city, bill_state, bill_zip, defaultCard, user) " + 
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", store, null, this.databaseError);
    });
  }

  this.getAllCreditCards = function(user, callback){
    this.db.transaction(function(tx){
      tx.executeSql("SELECT * FROM creditCards WHERE user = ?", [user], callback, this.databaseError);
    }, this.databaseError);
  }

  this.getDefaultCreditCard = function(user, callback){
    this.db.transaction(function(tx){
      tx.executeSql("SELECT * FROM creditCards WHERE user = ? AND defaultCard = 'true'", [user], callback, this.databaseError);
    });
  };

  this.getCreditCardById = function(id, callback){
    this.db.transaction(function(tx){
      tx.executeSql("SELECT * FROM creditCards WHERE id = ?", [id], callback, this.databaseError);
    }, this.databaseError);
  };
}

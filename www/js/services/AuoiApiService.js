AuoiApiService = function () {
	var service = {};

    var accessToken = null;
    var refreshToken = null;
    var deviceToken = null;

    function post(endpoint, params, observer) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: endpoint,
                type: "POST",
                data: params,
                dataType: "json",
                cache: false,
                headers: {
                	"authorization": accessToken || undefined,
                },
                success: function(result) {
                    if (observer) {
                        observer(result, null);
                    }
                    resolve(result);
                },
                error: function(req, status, err) {
                    if (observer) {
                        observer(null, err);
                    }
                    reject(err);
                },
                complete: function(result) {
                    // Do nothing;
                },
            });
        });
    }
    
    function signInObserver(result, err) {
        if (err) {
            return;
        }

        if (result.success) {
            refreshToken = result.data.refreshToken;
            accessToken = result.data.accessToken;
        }
    }

    function signOutObserver(result, err) {
        refreshToken = null;
        accessToken = null;
    }

    function checkToken() {
        if (!accessToken) {
            alert("Access token is undefined");
        }
        if (!refreshToken) {
            alert("Refresh token is undefined");
        }
    }

    service.setDeviceToken = function(token) {
        deviceToken = token;
    }

    service.accountSignIn = function(sid, password) {
        return post("https://apis.shop.auoi.net/v1.0/account/sign-in", {
            "sid": sid,
            "password": password,
            "deviceType": "android",
            "deviceToken": deviceToken,
        }, signInObserver);
    }

    service.accountSignOut = function() {
        return post("https://apis.shop.auoi.net/v1.0/account/sign-out", {
            // Nothing;
        }, signOutObserver);
    }

    service.accountSignRefresh = function() {
        checkToken();
        return post("https://apis.shop.auoi.net/v1.0/account/sign-refresh", {
            "refreshToken": refreshToken
        }, signInObserver);
    }

    service.accountSignUp = function(sid, password, name) {
        return post("https://apis.shop.auoi.net/v1.0/account/sign-up", {
            "sid": sid,
            "password": password,
            "name": name,
            "deviceType": "android",
            "deviceToken": deviceToken,
        }, signInObserver);
    }

    service.accountMe = function() {
        checkToken();
        return post("https://apis.shop.auoi.net/v1.0/account/me", {
            // Nothing;
        });
    }

    service.accountSidExists = function(sid) {
        return post("https://apis.shop.auoi.net/v1.0/account/sid-exists", {
            "sid": sid,
        });
    }

    service.noticeDetail = function(id) {
        return post("https://apis.shop.auoi.net/v1.0/notice/detail", {
            "id": id,
        });
    }

    service.noticeList = function(lastId, count) {
        return post("https://apis.shop.auoi.net/v1.0/notice/list", {
            "lastId": lastId,
            "count": count,
        });
    }

    service.orderCreate = function(productCode, stock) {
        checkToken();
        return post("https://apis.shop.auoi.net/v1.0/order/create", {
            "productCode": productCode,
            "stock": stock,
        });
    };

    service.orderListByOrderer = function(lastId, count) {
        checkToken();
        // return post("https://apis.shop.auoi.net/v1.0/order/list/by-orderer", {
        return post("https://apis.shop.auoi.net/v1.0/order/list/ordered", {
            "lastId": lastId,
            "count": count,
        });
    };

    service.orderListByReceiver = function(lastId, count) {
        checkToken();
        // return post("https://apis.shop.auoi.net/v1.0/order/list/by-receiver", {
        return post("https://apis.shop.auoi.net/v1.0/order/list/received", {
            "lastId": lastId,
            "count": count,
        });
    };

    service.productCreate = function(title, description, unitPrice, currency, availableStock) {
        checkToken();
        return post("https://apis.shop.auoi.net/v1.0/product/create", {
            "title": title,
            "description": description,
            "unitPrice": unitPrice,
            "currency": currency,
            "availableStock": availableStock,
        });
    };

    service.productDetail = function(code) {
        return post("https://apis.shop.auoi.net/v1.0/product/detail", {
            "code": code,
        });
    };

    service.productList = function(lastId, count) {
        return post("https://apis.shop.auoi.net/v1.0/product/list", {
            "lastId": lastId,
            "count": count,
        });
    };

    service.productListBySeller = function(lastId, count) {
        checkToken();
        // return post("https://apis.shop.auoi.net/v1.0/product/list/by-seller", {
        return post("https://apis.shop.auoi.net/v1.0/product/list", {
            "lastId": lastId,
            "count": count,
        });
    };

	return service;
}
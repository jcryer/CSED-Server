$(document).ready(function() {
	$('#submit').click(function() {
		var username = $('#username').val();
        var password = $('#password').val();
        console.log(username);
		//$.post("https://csed-server.herokuapp.com/api/login/", {"username": username, "password": password});
        console.log(JSON.stringify({"username": username, "password": password}));
		$.ajax({
			url: "api/login",
			type: "POST",
			data: JSON.stringify({"username": username, "password": password}),
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function(data) {
				console.log(data);
				console.log("Works");
			}
		});
	});
});

function userLogin() {	
	document.location = "differentPage.html";
}
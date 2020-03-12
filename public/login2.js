$(document).ready(function() {
    var delayTime = 1500;
    
    $("#registerInfo").hide();
    $("#loginSectionID").css("height", "400px");

    $('#password').keyup(function(e){
        if(e.keyCode == 13)
        {
            $("#loginSubmit").trigger("click");
        }
    });

    $('#registerRepeatPassword').keyup(function(e){
        if(e.keyCode == 13)
        {
            $("#registerSubmit").trigger("click");
        }
    });

    $('#loginScreenLink').click(function() {
        $("#loginInfo").show();
        $("#registerInfo").hide();
        $("#loginSectionID").css("height", "400px");
    });
    
    $('#registerScreenLink').click(function() {
        $("#loginInfo").hide();
        $("#registerInfo").show();
        $("#loginSectionID").css("height", "500px");
    });
    
    $("#loginSubmit").click(function(){

        var username = $("#username").val();
        var password = $("#password").val();
		
		$.ajax({
			url: "api/login",
			type: "POST",
			data: JSON.stringify({"username": username, "password": password}),
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function(data) {
				if (data == true) {
					$("#loginSectionID").removeClass("loginSection");
                    $("#loginSectionID").addClass("loginSectionHidden");
                    window.location.replace("connect");

                    // Redirect, I guess.
                }
                else {
                    $("#loginIncorrect").show();
                }
			}
		});
	});

    $("#registerSubmit").click(function(){

        var username = $("#registerUsername").val();
        var password = $("#registerPassword").val();
        var repeatPassword = $("#registerRepeatPassword").val();
        if (username == "") {
            $("#registerIncorrect").text("You may not leave the username field empty.");
            $("#registerIncorrect").show();
        }
        else if (password == "") {
            $("#registerIncorrect").text("You may not leave the password field empty.");
            $("#registerIncorrect").show();
        }
        else {
            if (password == repeatPassword) {

				$.ajax({
					url: "api/register",
					type: "POST",
					data: JSON.stringify({"username": username, "password": password}),
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					success: function(data) {
						if (data == true) {
							$("#loginSectionID").removeClass("loginSection");
                            $("#loginSectionID").addClass("loginSectionHidden");
                            window.location.replace("connect");
							// Redirect, I guess.
						}
						else {
                            $("#registerIncorrect").text("That username is already taken.");
							$("#registerIncorrect").show();						
						}
					}
				});
			
				/*
                $.ajax({
                    url: "register",
                    method: "POST",
                    dataType: "json",
                    crossDomain: true,
                    contentType: "application/json; charset=utf-8",
                    cache: false,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
                        xhr.setRequestHeader("X-Mobile", "false");
                    },
                    success: function (data) {
                        if (data.status == true) {
                            // Redirect to login oR AUTO LOGIN UNSURE PLEASE HELP  
                        }
                        else {
                            $("#registerIncorrect").text("That username is already taken.");

                            $("#registerIncorrect").show();

                            // username used already
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {

                    }
				});
				*/
            }
            else {
                // two password boxes not the same
                $("#registerIncorrect").text("Passwords do not match.");
                $("#registerIncorrect").show();
            }
        }
    }); 
});
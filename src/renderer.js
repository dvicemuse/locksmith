// define a new console
var console=(function(oldCons){
    return {
        log: function(text){
            text = JSON.stringify(text);
            oldCons.log(text);
        },
        info: function (text) {
            text = JSON.stringify(text);
            oldCons.info(text);
        },
        warn: function (text) {
            text = JSON.stringify(text);
            oldCons.warn(text);
        },
        error: function (text) {
            text = JSON.stringify(text);
            oldCons.error(text);
        }
    };
}(window.console));

//Then redefine the old console
window.console = console;

document.querySelectorAll('input[type=text], textarea').forEach(field => field.spellcheck = false);

let dispatchCallbacks = {};
$.fn.dispatch = (name, vars, callback) => {
    var eventHash = window.electron.dispatch(name, vars);
    if(typeof(callback) == 'function') dispatchCallbacks[eventHash] = callback;    
    return this;
};

var connectionTested    = false;
var magicUnleashed      = false;
var generatedCMD        = '';
var formFields          = {
    keyName     : $('#keyName'),
    userName    : $('#userName'),
    password    : $('#password'),
    host        : $('#host'),
    port        : $('#port'),
};

function formFieldValues(){
    var ret = {};
    for(var x in formFields) ret[x] = formFields[x].val();
    return ret;
}

var validateTimer;

function validateForm(){   

    clearTimeout(validateTimer);

    validateTimer = setTimeout(() => {
        var mainWindowHeight = 650;
        var mainWindowWidth = 600;

        for(var x in formFields){
            $(formFields[[x]]).removeClass('is-invalid');
            if(x !== 'keyName' && x !== 'port' && !formFields[x].is(':focus') || magicUnleashed) formFields[x].attr('disabled', true);
        }

        $('#testSSHBtn').attr('disabled', true);
        $('#unleashMagic').attr('disabled', true);
        $('#port').attr('disabled', true);
        $('.toggle-password').addClass('d-none');
        $('.validation-message').removeClass('show');

        if(magicUnleashed){
            if($('#generatedCMD').val() != generatedCMD) $('#generatedCMD').val(generatedCMD);
            $('#nowUseWrap').removeClass('d-none');
            $('#tryItBtn').removeAttr('disabled');
            $('#password').attr('type', 'password');
            $('.leashed').hide();
            mainWindowHeight = 450;

        }
        else{
            $('#tryItBtn').attr('disabled', true);
            $('#testUnleashWrap').addClass('d-none');
            $('#unleashMagic').addClass('d-none');
            $('#nowUseWrap').addClass('d-none');

            if(formFields.keyName.val().length){

                var keyNamePattern = /^[a-zA-Z0-9-_]+$/;
                if(keyNamePattern.test(formFields.keyName.val())){

                    formFields.userName.removeAttr('disabled');

                    if(formFields.userName.val().length){

                        var userNamePattern = /^[a-zA-Z0-9-_]{3,}$/;
                        if(userNamePattern.test(formFields.userName.val())){
                            formFields.password.removeAttr('disabled');

                            if(formFields.password.val().length){
                                $('.toggle-password').removeClass('d-none');

                                var passwordPattern = /^\S{3,}$/;
                                if(passwordPattern.test(formFields.password.val())){

                                    formFields.host.removeAttr('disabled');

                                    if(formFields.host.val().length) formFields.port.removeAttr('disabled');

                                    if(formFields.host.val().length && formFields.port.val().length){

                                        var pattern = /(^(\b\d{1,3}\b\.){3}(\b\d{1,3})$)|(^(?!.*(ftp|www|http(s)?))(([A-Za-z0-9-_]{1,}\.)+([A-Za-z0-9]{2,}))$)/i;
                                        if(pattern.test(formFields.host.val())){
                                            $('#testUnleashWrap').removeClass('d-none');
                                            $('#testSSHBtn').removeAttr('disabled');
                                            mainWindowHeight = 700;

                                            if(connectionTested) $('#unleashMagic').removeClass('d-none').removeAttr('disabled');
                                        }
                                        else{
                                            formFields.host.addClass('is-invalid');
                                            formFields.host.closest('.col').find('.validation-message').addClass('show').html('The host name must be a valid IP address or domain name.');
                                        }
                                    }
                                }
                                else{
                                    formFields.password.addClass('is-invalid');
                                    formFields.password.closest('.col').find('.validation-message').addClass('show').html('The password must be at least 3 characters and may only contain letters, numbers, underscores, and hyphens.');

                                }
                            }
                        }
                        else{
                            formFields.userName.addClass('is-invalid');
                            formFields.userName.closest('.col').find('.validation-message').addClass('show').html('The username must be at least 3 characters and may only contain letters, numbers, underscores, and hyphens.');
                        }
                    }
                }
                else{
                    formFields.keyName.addClass('is-invalid');
                    formFields.keyName.closest('.col').find('.validation-message').addClass('show').html('The key name must be at least 3 characters and may only contain letters, numbers, underscores, and hyphens.');
                }
            }
        }

        $(window).dispatch('setWindowSize', {
            width: mainWindowWidth,
            height: mainWindowHeight,
            animate: true,
        });
    }, 500);


}

$('#locksmith-form').on('submit', function(e){
    e.preventDefault();
});

$(':input').on('keyup paste', function(e){
    if($(this).attr('id') !== 'generatedCMD') validateForm();
});

$(window).on('fromMainController', function(e, data){
    if(typeof(dispatchCallbacks[e.detail.eventHash]) == 'function'){
        dispatchCallbacks[e.detail.eventHash](e, e.detail.err, e.detail.msg);
        delete dispatchCallbacks[e.detail.eventHash];
    }
});

$(".toggle-password").click(function () {
    var passwordInput = $($(this).siblings(".password-input"));
    var icon = $(this);
    if (passwordInput.attr("type") == "password") {
        passwordInput.attr("type", "text");
        icon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
        passwordInput.attr("type", "password");
        icon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
});

$('button[disabled]').click(function(e){
    e.preventDefault();
    e.stopPropagation();
});

$('#testSSHBtn').click((e) => {
    $(this).dispatch('testSSH', formFieldValues(), function(e, err, msg){
        connectionTested = !err;
        validateForm();
        if(err){
            if(msg.indexOf("Could not resolve hostname") >= 0){
                var hostEle = $('#host').addClass('is-invalid').focus();
                $(hostEle)[0].select();
                $('#testSSHBtn').attr('disabled', true);
                $('#unleashMagic').addClass('d-none');
            }
        }        
    });
});

$('#unleashMagic').click( async () => {
     $(this).dispatch('unleashMagic', formFieldValues(), function(e, err, msg){
        magicUnleashed = !err;
        generatedCMD = 'ssh '+formFieldValues().keyName;
        validateForm();        
    });
});

$('#tryItBtn').click(function(){
    $(this).dispatch('tryIt', formFieldValues());
});

$('#gtfoBtn').click(function(){
    window.electron.dispatch('quit');
});
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

function validateForm(){   

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
            formFields.userName.removeAttr('disabled');
            if(formFields.userName.val().length){
                formFields.password.removeAttr('disabled');
                
                if(formFields.password.val().length){
                    $('.toggle-password').removeClass('d-none');
                    formFields.host.removeAttr('disabled');

                    if(formFields.host.val().length) formFields.port.removeAttr('disabled');

                    if(formFields.host.val().length && formFields.port.val().length){
                        $('#testUnleashWrap').removeClass('d-none');
                        $('#testSSHBtn').removeAttr('disabled');
                        mainWindowHeight = 700;

                        if(connectionTested) $('#unleashMagic').removeClass('d-none').removeAttr('disabled');
                    }
                }
            }
        }
    }

    $(window).dispatch('setWindowSize', {
        width: mainWindowWidth,
        height: mainWindowHeight,
        animate: true,
    });
}

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
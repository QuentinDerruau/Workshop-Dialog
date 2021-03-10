
const LoginSignUp = document.querySelector('#LoginSignUp');
const PasswordSignUp1 = document.querySelector('#PasswordSignUp1');
const PasswordSignUp2 = document.querySelector('#PasswordSignUp2');
const EmailSignUp = document.querySelector('#EmailSignUp');
const PhoneSignUp = document.querySelector('#PhoneSignUp');
const VitalCardSignUp = document.querySelector('#VitalCardSignUp');
const ValidSignUp = document.querySelector('#ValidSignUp');
const GoBackToConnect = document.querySelector('#GoBackToConnect');

ValidSignUp.addEventListener('click',(e) => {
    e.preventDefault();
    if (!LoginSignUp.value || !PasswordSignUp1.value || !PasswordSignUp2.value || !EmailSignUp.value || !PhoneSignUp.value || !VitalCardSignUp.value){
        return;
    }
    else if( PasswordSignUp1.value != PasswordSignUp2.value ){
        return;
    }
    else{
        window.location.href = "./connection";
    }
})
GoBackToConnect.addEventListener('click', (e) =>{
    window.location.href = "./connection";
})
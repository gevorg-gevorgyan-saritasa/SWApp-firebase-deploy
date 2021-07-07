import {singInWithGoogle} from '../../firebase/auth';

import '../../css/login.css'
import '../../css/header.css'

const signInButton = document.getElementById('sign-in-google-button');

signInButton?.addEventListener('click', singInWithGoogle);
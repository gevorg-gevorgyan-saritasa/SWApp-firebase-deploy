import {Paths} from './values/values';

/**
 * Function determines which block will be shown on a index page, depending on whether the user is authenticated or not.
 *
 * @param {HTMLButtonElement[]} filmManagementButtons
 * @param {HTMLDivElement} authBlock, Block that will be shown if user is authenticated.
 * @param {HTMLDivElement} noAuthBlock, Block that will be shown if user is not authenticated.
 * @param {HTMLSpanElement} username, Span for username
 */
export function authUiMainPage(filmManagementButtons : HTMLCollection, authBlock : HTMLDivElement,
                               noAuthBlock : HTMLDivElement, username : HTMLSpanElement) : void {
  const isAuth  = Boolean(localStorage.getItem('token'));
  const buttons = Array.prototype.slice.call(filmManagementButtons);

  noAuthBlock.classList.toggle('hidden', isAuth);
  authBlock.classList.toggle('hidden', !isAuth);

  buttons.forEach(button => {
    button.classList.toggle('hidden', !isAuth);
  })

  username.innerHTML = String(localStorage.getItem('username'));
}

/**
 * Shows buttons depending on authentication status.
 * @param {HTMLButtonElement} editButton Button for film editing.
 * @param {HTMLButtonElement} deleteButton Button for film deleting.
 */
export function authUiFilmButtonsCells (editButton : HTMLTableCellElement, deleteButton : HTMLTableCellElement) {
  const isAuth  = Boolean(localStorage.getItem('token'));
  editButton.classList.toggle('hidden', !isAuth);
  deleteButton.classList.toggle('hidden', !isAuth);
}

/**
 * Function checks access to the film page. If user is not authenticated, it will redirect to login page.
 *
 * @param {HTMLSpanElement} username, Span for username.
 */
export function authUi(username : HTMLSpanElement) : void {
  if (!localStorage.getItem('token')) {
    window.location.href = Paths.LoginPagePath;
  } else {
    username.innerHTML = String(localStorage.getItem('username'));
  }
}
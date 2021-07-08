import filmService from '../../firebase/filmService';
import {
  Navigation,
  SearchOptions,
  SortOptions,
  Paths,
  DEBOUNCE_DELAY_TIME,
} from '../values/values';
import {signOut} from '../../firebase/auth';
import {authUiMainPage} from '../authUi';
import {debounce} from '../helpers/debounce';
import FilmDto from "../../DTOs/filmDto";
import '../../css/main.css'
import '../../css/header.css'

let sortOptions = {field: SortOptions.DefaultOrder, rule: SortOptions.Asc};
let searchOption = '';

const tableBody = document.getElementById('films-table-body');

const signOutButton = document.getElementById('sign-out-button');
const authBlock = <HTMLDivElement>document.getElementById('auth-block');
const noAuthBlock = <HTMLDivElement>document.getElementById('no-auth-block');

const searchInput = <HTMLInputElement>document.getElementById('search-field');

const ascSortButtons = document.getElementsByName('asc-table-sort-button');
const descSortButtons = document.getElementsByName('desc-table-sort-button');

const nextPageButton = <HTMLButtonElement>document.getElementById('next-page-button');
const prevPageButton = <HTMLButtonElement>document.getElementById('prev-page-button');

window.onload = () => {
  authUiMainPage(authBlock, noAuthBlock, document.getElementById('username') as HTMLSpanElement);
  loadStartPage();
};

signOutButton?.addEventListener('click', () => {
  signOut()
      .then(() => window.location.href = Paths.MainPagePath);
});

nextPageButton?.addEventListener('click', () => {
  loadPage(Navigation.NextPage);
});

prevPageButton?.addEventListener('click', () => {
  loadPage(Navigation.PrevPage);
});

searchInput?.addEventListener('input', debounce(searchByTitle, DEBOUNCE_DELAY_TIME));

ascSortButtons.forEach(ascSortButton => {
  ascSortButton.addEventListener('click', (e : Event) => {
    const target = <Element>e.target;
    const column = target.parentElement?.parentElement?.id;

    sortOptions.field = SortOptions.SortingFields + column;
    sortOptions.rule = SortOptions.Asc;

    loadStartPage();
  });
});

descSortButtons.forEach(descSortButton => {
  descSortButton.addEventListener('click', (e: Event) => {
    const target = <Element>e.target;
    const column = target.parentElement?.parentElement?.id;

    sortOptions.field = SortOptions.SortingFields + column;
    sortOptions.rule = SortOptions.Desc;

    loadStartPage();
  });
});

/**
 * A function that finds film by the entered title.
 *
 */
function searchByTitle() : void {
  searchOption = searchInput?.value;
  if (searchOption) {
    sortOptions.field = SearchOptions.DefaultSearchField;
    sortOptions.rule = SortOptions.Asc;
  } else {
    sortOptions.field = SortOptions.DefaultOrder;
    sortOptions.rule = SortOptions.Asc;
  }

  filmService.getPage(sortOptions, null, searchOption)
    .then(foundFilms => {
      fillTable(foundFilms);
    });
}

/**
 * Loading page when navigating using the pagination menu arrows.
 * 
 * @param {string} direction, Transition direction.
 */
function loadPage(direction : string) : void {
  filmService.getPage(sortOptions, direction, searchOption)
    .then(pageData => {
      if (pageData.length !== 0) {
        fillTable(pageData);
      }
    });
}

/**
 * Removing all existing rows and filling table rows with received films data.
 *
 * @param {Array<FilmDto>} rowsData, Received films data.
 */
function fillTable(rowsData : FilmDto[]) : void {
  tableBody!.innerHTML = '';

  rowsData.forEach(film => {
    const episode = document.createElement('td');
    const title = document.createElement('td');
    const director = document.createElement('td');
    const releaseDate = document.createElement('td');
    const info = document.createElement('td');

    info.className = 'info-cell';
    info.innerHTML = 'More info...';
    info.addEventListener('click', getMoreInfo);

    episode.innerHTML = String(film.episode_id);
    title.innerHTML = film.title;
    director.innerHTML = film.director;
    releaseDate.innerHTML = film.release_date;

    const row = document.createElement('tr');

    row.id = String(film.episode_id);

    row.appendChild(episode);
    row.appendChild(title);
    row.appendChild(director);
    row.appendChild(releaseDate);
    row.appendChild(info);

    tableBody?.appendChild(row);
  });
}

/**
 * Redirect to film page or login page, depending on user's authentication status.
 *
 * @param {Event} e, Event object (row as a target).
 */
function getMoreInfo(e: Event) {
  const target = <Element>e.target;
  if (localStorage.getItem('token')) {
    const params = new URLSearchParams();
    params.append('id', <string>target?.parentElement?.id);
    window.location.href = `${Paths.FilmPagePath}?${params.toString()}`;
  } else {
    window.location.href = Paths.LoginPagePath;
  }

}

/**
 * Loading start page on the first page visit or after sorting.
 *
 */
function loadStartPage() : void {
  filmService.getPage(sortOptions)
    .then(pageData => {
      fillTable(pageData);
    });
}
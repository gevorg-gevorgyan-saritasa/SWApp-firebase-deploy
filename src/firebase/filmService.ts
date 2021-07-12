import {
  FILMS_COLLECTION,
  DEFAULT_PAGE_SIZE,
  Navigation,
  SearchOptions,
  DEFAULT_JOIN_ARRAY_SIZE, FilmFields, FILM_MODEL,
} from '../js/values/values';
import firebaseApp from './firebase';
import FilmDto from '../DTOs/filmDto';
import firebase from 'firebase';
import {FilmRelatedEntities, SortOptions} from '../types/types';

class FilmService {
  currentPageFilms: firebase.firestore.QuerySnapshot | undefined;
  /**
   * Function that gets a list of films of one page, depending on the options.
   *
   * @param {object} sortOptions, Options for sorting the receiving movies.
   * @param {string} direction, Transition direction (previous or next page).
   * @param {string} searchOption, Option to search film by name.
   *
   * @return {Promise<*>} Returns promise with received films array.
   */
  async getPage(sortOptions : SortOptions,
                direction?: string | null, searchOption : string = '') : Promise<FilmDto[]> {
    //getting the next character after searchOption alphabetically. Improves the accuracy of the search
    const end : string = searchOption.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
    let pageFilms = <firebase.firestore.Query>firebaseApp.firestore().collection(FILMS_COLLECTION);

    if(searchOption) {
      pageFilms = await pageFilms
        .where(SearchOptions.DefaultSearchField, '>=', searchOption)
        .where(SearchOptions.DefaultSearchField, '<=', end)
    }

    switch (direction) {
      case Navigation.PrevPage:
        const prevPageFilms : firebase.firestore.QuerySnapshot = await pageFilms
          .orderBy(sortOptions.field, sortOptions.rule as firebase.firestore.OrderByDirection)
          .endBefore(this.currentPageFilms?.docs[0])
          .limitToLast(DEFAULT_PAGE_SIZE)
          .get()
        if (prevPageFilms.size !== 0) {
          this.currentPageFilms = prevPageFilms;
        }
        break;
      case Navigation.NextPage:
        const nextPageFilms : firebase.firestore.QuerySnapshot = await pageFilms
          .orderBy(sortOptions.field, sortOptions.rule as firebase.firestore.OrderByDirection)
          .startAfter(this.currentPageFilms?.docs[this.currentPageFilms.size - 1])
          .limit(DEFAULT_PAGE_SIZE)
          .get()
        if (nextPageFilms.size !== 0) {
          this.currentPageFilms = nextPageFilms;
        }
        break;
      default:
        this.currentPageFilms = await pageFilms
          .orderBy(sortOptions.field, sortOptions.rule as firebase.firestore.OrderByDirection)
          .limit(DEFAULT_PAGE_SIZE)
          .get();

        break;
    }

    return this.getFilmsData(<firebase.firestore.QuerySnapshot>this.currentPageFilms);
  }

  /**
   * Extracts films data from docs array.
   *
   * @param {object} films, Films object received from db.
   *
   * @return {Array<Film>} Films data array.
   */
  getFilmsData(films : firebase.firestore.QuerySnapshot) : FilmDto[] {
    return films.docs.map(doc => doc.data() as FilmDto);
  }

  /**
   * Gets one film by id.
   *
   * @param {number} currentFilmId, Film id.
   * @return {Promise<*>} Promise with film data.
   */
  async getSingleFilm(currentFilmId : number) : Promise<FilmDto> {
    let film = await firebaseApp.firestore().collection(FILMS_COLLECTION)
      .where(SearchOptions.FilmEpisodeField, '==', currentFilmId)
      .get();

    return film.docs[0].data() as FilmDto;
  }

  /**
   * Gets array of names of related entity items.
   *
   * @param {string} entityCollectionName, Name of related entity (collection in db).
   * @param {Array<number>} relatedEntityIds, Array of related entity items ids.
   * @return {Promise<*[]>} Promise with related entity items array.
   */
  async getFilmRelatedEntityItems(entityCollectionName : string, relatedEntityIds : Array<number>) : Promise<string[]> {
    const idsArray : Array<number[]> = [];
    let relatedEntityArr : Array<firebase.firestore.DocumentSnapshot> = [];

    //Splitting the array, since firebase does not allow arrays longer than 10 in where 'in'
    for (let i = 0; i < relatedEntityIds.length; i += DEFAULT_JOIN_ARRAY_SIZE) {
      idsArray.push(relatedEntityIds.slice(i, i+ DEFAULT_JOIN_ARRAY_SIZE));
    }

    for (const array of idsArray) {
      const tmpArr = await firebaseApp.firestore().collection(entityCollectionName)
        .where('pk', 'in', array)
        .get();
      relatedEntityArr = relatedEntityArr.concat(tmpArr.docs);
    }

    return relatedEntityArr.map(item => {
      return item.data()?.fields.name;
    })
  }

  async getAllRelatedEntities() : Promise<FilmRelatedEntities> {
    const entitiesItems = {} as FilmRelatedEntities;

    entitiesItems.characters = await this.getEntity(FilmFields.characters);
    entitiesItems.vehicles = await this.getEntity(FilmFields.vehicles);
    entitiesItems.planets = await this.getEntity(FilmFields.planets);
    entitiesItems.species = await this.getEntity(FilmFields.species);
    entitiesItems.starships = await this.getEntity(FilmFields.starships);

    return entitiesItems;
  }

  async getEntity(collectionName : string) : Promise<any[]> {
    let items = await firebaseApp.firestore().collection(collectionName).get();

    return items.docs.map(item => {
      let obj = item.data().fields;
      obj.id = item.data().pk;
      return obj;
    });
  }

  async addFilm(filmData : FilmDto) : Promise<void> {
    filmData.pk = await this.getLastFilmId() + 1;
    filmData.fields.episode_id = filmData.pk;
    filmData.fields.edited = new Date().toISOString();
    filmData.fields.created = new Date().toISOString();
    filmData.model = FILM_MODEL;
    await firebaseApp.firestore().collection(FILMS_COLLECTION)
        .add(filmData);
  }

  async editFilm(filmData : FilmDto, currentFilmId: number) : Promise<void> {
    filmData.fields.edited = new Date().toISOString();
    const currentFilm = await firebaseApp.firestore().collection(FILMS_COLLECTION)
        .where(SearchOptions.FilmEpisodeField, '==', currentFilmId)
        .get();
    await firebaseApp.firestore().collection(FILMS_COLLECTION).doc(currentFilm.docs[0].id)
        .set(filmData, {merge: true});
  }

  async deleteFilm(currentFilmId : number) : Promise<void> {
    const currentFilm = await firebaseApp.firestore().collection(FILMS_COLLECTION)
        .where(SearchOptions.FilmEpisodeField, '==', currentFilmId)
        .get();
    await firebaseApp.firestore().collection(FILMS_COLLECTION).doc(currentFilm.docs[0].id)
        .delete();
  }

  async getLastFilmId() : Promise<number> {
    const films = await firebaseApp.firestore().collection(FILMS_COLLECTION)
        .get();

    return films.docs[(films.docs.length - 1)].data().pk;
  }
}

export default new FilmService();
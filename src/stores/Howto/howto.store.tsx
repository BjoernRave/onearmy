import { observable, action } from 'mobx'
import { afs } from '../../utils/firebase'
import {
  IHowto,
  IHowtoFormInput,
  IHowToStepFormInput,
  IHowtoStep,
} from 'src/models/howto.models'
import { Database } from 'src/stores/database'
import { IConvertedFileMeta } from 'src/components/ImageInput/ImageInput'
import { Storage } from '../storage'
import { ModuleStore } from '../common/module.store'

export class HowtoStore extends ModuleStore {
  // we have two property relating to docs that can be observed
  @observable
  public activeHowto: IHowto | undefined
  @observable
  public allHowtos: IHowto[]
  @observable
  public uploadStatus: IHowToUploadStatus = getInitialUploadStatus()

  constructor() {
    // call constructor on common ModuleStore (with db endpoint), which automatically fetches all docs at
    // the given endpoint and emits changes as data is retrieved from cache and live collection
    super('howtosV1')
    this.allDocs$.subscribe(docs => {
      this.allHowtos = docs as IHowto[]
    })
  }

  @action
  public async getDocBySlug(slug: string) {
    const ref = afs
      .collection('howtosV1')
      .where('slug', '==', slug)
      .limit(1)
    const collection = await ref.get()
    const activeHowto =
      collection.docs.length > 0
        ? (collection.docs[0].data() as IHowto)
        : undefined
    this.activeHowto = activeHowto
    return activeHowto
  }
  @action
  public updateUploadStatus(update: keyof IHowToUploadStatus) {
    this.uploadStatus[update] = true
  }

  public generateID = () => {
    return Database.generateDocId('howtosV1')
  }

  public async uploadHowTo(values: IHowtoFormInput, id: string) {
    console.log('uploading how-to', id)
    console.log('values', values)
    try {
      // upload images
      const processedCover = await this.uploadHowToFile(
        values.cover_image[0],
        id,
      )
      this.updateUploadStatus('Cover')
      const processedSteps = await this.processSteps(values.steps, id)
      this.updateUploadStatus('Step Images')
      // upload files
      const processedFiles = await this.uploadHowToBatch(
        values.files as File[],
        id,
      )
      this.updateUploadStatus('Files')
      // populate DB
      const meta = Database.generateDocMeta('howtosV1', id)
      // redefine howTo based on processing done above (should match stronger typing)
      const howTo: IHowto = {
        ...values,
        cover_image: processedCover,
        steps: processedSteps,
        files: processedFiles,
        ...meta,
      }
      console.log('populating database', howTo)
      this.updateDatabase(howTo)
      this.updateUploadStatus('Database')
      // complete
      this.updateUploadStatus('Complete')
      console.log('post added')
      this.activeHowto = howTo
      return howTo
    } catch (error) {
      console.log('error', error)
      throw new Error(error.message)
    }
  }

  // go through each step, upload images and replace data
  private async processSteps(steps: IHowToStepFormInput[], id: string) {
    // NOTE - outer loop could be a map and done in parallel but for loop easier to manage
    const stepsWithImgMeta: IHowtoStep[] = []
    for (const step of steps) {
      const stepImages = step.images as IConvertedFileMeta[]
      const imgMeta = await this.uploadHowToBatch(stepImages, id)
      step.images = imgMeta
      stepsWithImgMeta.push({ ...step, images: imgMeta })
    }
    return stepsWithImgMeta
  }

  private uploadHowToFile(file: File | IConvertedFileMeta, id: string) {
    console.log('uploading file', file)
    // switch between converted file meta or standard file input
    let data: File | Blob = file as File
    if (file.hasOwnProperty('photoData')) {
      file = file as IConvertedFileMeta
      data = file.photoData
    }
    return Storage.uploadFile(
      `uploads/howtosV1/${id}`,
      file.name,
      data,
      file.type,
    )
  }

  private async uploadHowToBatch(
    files: (File | IConvertedFileMeta)[],
    id: string,
  ) {
    const promises = files.map(async file => {
      return this.uploadHowToFile(file, id)
    })
    return Promise.all(promises)
  }

  private updateDatabase(howTo: IHowto) {
    return Database.setDoc(`howtosV1/${howTo._id}`, howTo)
  }
}

interface IHowToUploadStatus {
  Cover: boolean
  Files: boolean
  'Step Images': boolean
  Database: boolean
  Complete: boolean
}

function getInitialUploadStatus() {
  const status: IHowToUploadStatus = {
    Cover: false,
    'Step Images': false,
    Files: false,
    Database: false,
    Complete: false,
  }
  return status
}

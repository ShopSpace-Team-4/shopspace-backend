import { generateHash , compareHash, generateEncryption, generateDecryption} from "../../common/utils/security"
export class SecurityService{
    constructor(){}
    generateHash=generateHash
    compareHash= compareHash

    generateEncryption=generateEncryption
    generateDecryption=generateDecryption
}
import faker from "faker";
import * as _ from "lodash";

/**
 * Random data generation utilities.
 */
export default class DataGenerator {


    static id() {
        return faker.random.uuid();
    }

    static getPerson() {
        return {
            name: DataGenerator.getPersonName(),
            birthdate: DataGenerator.getBirthdate(),
            job: DataGenerator.getJob(),
            address: DataGenerator.getAddress()
        }
    }

    static getPersonName() {
        return faker.name.findName();
    }

    static getAddress() {
        return `${faker.address.streetAddress()}, ${faker.address.zipCode()} ${faker.address.city()}, ${faker.address.country()}`;
    }

    static getBirthdate() {
        return faker.date.between(new Date(1960, 1, 1), new Date(2010, 1, 1));
    }

    static getProjectName() {
        return faker.company.catchPhrase();
    }

    static getProjectDescription() {
        return faker.lorem.paragraph();
    }

    static getWord() {
        return faker.lorem.word();
    }

    static getInteger() {
        return faker.random.number({min: 10, max: 1E8});
    }

    static getJob() {
        return faker.name.jobDescriptor();
    }

    static getFieldNames(count:number=5): string[] {
        return _.range(count).map(i=>faker.database.column());
    }
}

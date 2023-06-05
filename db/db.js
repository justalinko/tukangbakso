
import fs from 'fs';
// create database folder
const database_name = "database-tukangbakso";
const tables = [
    "links",
    "users",
    "logs"
];

if(!fs.existsSync(database_name))
{
    fs.mkdirSync(database_name , {recursive:true});
}
tables.forEach(table => {
    if(!fs.existsSync(database_name + "/" + table + ".json"))
    {
        fs.writeFileSync(database_name + "/" + table + ".json", "[]");
    }
});

class DB{
    constructor()
    {
        this.database_name = database_name;
        this.tables = tables;
    }

    insert(table, data){
        const table_data = this.getData(table);
        console.log(table_data);
        table_data.push(data);
        this.saveData(table, table_data);
    }

    getData(table){
        const table_data = fs.readFileSync(this.database_name + "/" + table + ".json").toString();
        return JSON.parse(table_data);
    }

    saveData(table, data){
        fs.writeFile(this.database_name + "/" + table + ".json", JSON.stringify(data), (err) => {
            if(err) throw err;
        });
    }

    update(table, id, data){
        const table_data = this.getData(table);
        table_data[id] = data;
        this.saveData(table, table_data);
    }

    delete(table, id){
        const table_data = this.getData(table);
        table_data.splice(id, 1);
        this.saveData(table, table_data);
    }

    find(table, key){
        const table_data = this.getData(table);
        const result = table_data.filter(data => data.id == key);
        return result[0];
    }
    findAll(table, key){
        const table_data = this.getData(table);
        const result = table_data.filter(data => data.id == key);
        return result;
    }

    findMyLink(table, key){
        const table_data = this.getData(table);
        const result = table_data.filter(data => data.chatId == key);
        return result;
    }

}



export default new DB();
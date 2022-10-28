"use strict"

let Service, Characteristic, HomebridgeAPI
const packageJson = require("./package.json")
const storage = require('node-persist')

module.exports = function(homebridge) {

  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  HomebridgeAPI = homebridge
  homebridge.registerAccessory("homebridge-dummy-valve", "DummyValve", DummyValve)
}

function DummyValve(log, config) {

  this.log = log
  this.name = config.name || "DummyValveSwitch"

  this.manufacturer = packageJson.author
  this.serial = packageJson.version + "-" + packageJson.author
  this.model = packageJson.displayName
  this.firmware = packageJson.version
  this.storage = storage

  this.cacheDirectory = HomebridgeAPI.user.persistPath()

  this.service = new Service.Valve(this.name)

  this.storage.initSync({dir:this.cacheDirectory, forgiveParseErrors: true})
  
  let cachedActive = this.storage.getItemSync(this.name)

  if((cachedActive === undefined) || (cachedActive === false) || (cachedActive === 0)) {
    
    this.service.getCharacteristic(Characteristic.Active).updateValue(0)
    this.service.getCharacteristic(Characteristic.InUse).updateValue(0)
    this.storage.setItemSync(this.name, 0)

  } else {

    this.service.getCharacteristic(Characteristic.Active).updateValue(1)
    this.service.getCharacteristic(Characteristic.InUse).updateValue(1)
  
  }

}

DummyValve.prototype =  {
  
  getServices: function () {
  
    this.informationService = new Service.AccessoryInformation()

    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)
      .setCharacteristic(Characteristic.ValveType, 0)
  
    this.service.getCharacteristic(Characteristic.Active)
      .onSet(async (value) => {

        this.log("set 'Active' to => " + (value == 0 ? "Off" : "On"))
        
        this.storage.setItemSync(this.name, value)

        if(value == 0) {

          this.service.getCharacteristic(Characteristic.InUse).updateValue(value)
          setTimeout(() => {
            this.service.getCharacteristic(Characteristic.Active).updateValue(value)
          }, 50)

        } else {

          this.service.getCharacteristic(Characteristic.Active).updateValue(value)
          setTimeout(() => {
            this.service.getCharacteristic(Characteristic.InUse).updateValue(value)  
          }, 50)
        
        }
       
      })
      .onGet(async () => {
        
        let cachedActive = this.storage.getItemSync(this.name)
        this.service.getCharacteristic(Characteristic.Active).updateValue(cachedActive)    
        this.service.getCharacteristic(Characteristic.InUse).updateValue(cachedActive)  
        return cachedActive

      })

    return [this.informationService, this.service]

  }

}

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
    
}

DummyValve.prototype =  {
  
  setActive: function(on) {

    let state = (on == 0 ? "Off" : "On")
    this.log("set 'Active' to => " + state)
  
    this.storage.setItemSync(this.name, on)
  
    this.service.getCharacteristic(Characteristic.InUse).updateValue(on)
    this.service.getCharacteristic(Characteristic.Active).updateValue(on)
      
  },
  
  getActive: function() {

    let cachedActive = this.storage.getItemSync(this.name)
    this.service.getCharacteristic(Characteristic.InUse).updateValue(cachedActive)
    this.service.getCharacteristic(Characteristic.Active).updateValue(cachedActive)
      
    return cachedActive
  
  },

  getServices: function () {
  
    this.informationService = new Service.AccessoryInformation()

    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)
      .setCharacteristic(Characteristic.ValveType, 0)
  
    this.service.getCharacteristic(Characteristic.Active)
      .onGet(this.getActive.bind(this))
      .onSet(this.setActive.bind(this))

    return [this.informationService, this.service]

  }

}

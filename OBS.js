var tempo = "";
var OBSSave = {};
var EnumScenes = {};
var EnumItems = {};
var IndexItemTab = []; //associative array with sceneName as key and 

function parseHex(str) {
    var result = [];
    for (var i = 0; i < str.length; i += 2) {
        var n = parseInt("0x" + str.substring(i, i + 2));
        result.push(n);
    }
    return result;
}

/* Utilitary Function */
function valueBoolParameter(value, data) {
    if (local.values.getChild(value) == null) {
        local.values.addBoolParameter(value, "", data);
        local.values.getChild(value).setAttribute("readonly", true);
    } else {
        local.values.getChild(value).set(data);
    }
}

function valueStringParameter(value, data) {
    if (local.values.getChild(value) == null) {
        local.values.addStringParameter(value, "", data);
        local.values.getChild(value).setAttribute("readonly", true);
    } else {
        local.values.getChild(value).set(data);
    }
}

function valueBoolContainerParameter(container, value, data) {
    local.values.addContainer(container);
    if (local.values.getChild(container).getChild(value) == null) {
        local.values.getChild(container).addBoolParameter(value, "", data);
        local.values.getChild(container).getChild(value).setAttribute("readonly", true);
    } else {
        local.values.getChild(container).getChild(value).set(data);
    }
}

function valueStringContainerParameter(container, value, data) {
    local.values.addContainer(container);
    if (local.values.getChild(container).getChild(value) == null) {
        local.values.getChild(container).addStringParameter(value, "", data);
        local.values.getChild(container).getChild(value).setAttribute("readonly", true);
    } else {
        local.values.getChild(container).getChild(value).set(data);
    }
}

function colorToInt(color) {
    var r = parseInt(color[0] * 255);
    var g = parseInt(color[1] * 255);
    var b = parseInt(color[2] * 255);
    return r + (g << 0x8) + (b << 0x10);
}

function removeAllValues() {
    local.values.removeContainer("Scenes");
    local.values.removeContainer("Inputs");
    local.values.removeParameter("CurrentScene");
    local.values.removeContainer("Groups");
    local.values.removeParameter("CurrentCollection");
    local.values.removeContainer("Collections");
    local.values.removeParameter("outputActive");
    local.values.removeParameter("outputState");
    local.values.removeParameter("RecordStateChanged");
    local.values.removeContainer("Audio Input");
    local.values.removeContainer("Stream");
    local.values.removeContainer("Record");
    script.log("All values have been deleted");
}

/*
 This function will be called each time a value of this module has changed, meaning a parameter or trigger inside the "Values" panel of this module
 This function only exists because the script is in a module
*/
function moduleValueChanged(value) {
    if (value.name == "removeAllValues") {
        removeAllValues();
    }
}


function toDecimal(v) {
    return parseInt(v, 2);
}

/* ************************************************************************* */
/* ***************** WEBSOCKET  MESSAGE RECEIVED *************************** */

/* ************************************************************************* */
function wsMessageReceived(message) {
    /* ************************* CONNECTION ******************************** */
    var obsObj = JSON.parse(message);
    var d = obsObj.d;

    if (obsObj.op == 0) {
        var newEventSub = 0; // Start with EventSubscription::None

        // Add event subscriptions based on parameters
        if (local.parameters.eventSub.general.get()) newEventSub += (1 << 0); // EventSubscription::General
        if (local.parameters.eventSub.config.get()) newEventSub += (1 << 1); // EventSubscription::Config
        if (local.parameters.eventSub.scenes.get()) newEventSub += (1 << 2); // EventSubscription::Scenes
        if (local.parameters.eventSub.inputs.get()) newEventSub += (1 << 3); // EventSubscription::Inputs
        if (local.parameters.eventSub.transitions.get()) newEventSub += (1 << 4); // EventSubscription::Transitions
        if (local.parameters.eventSub.filters.get()) newEventSub += (1 << 5); // EventSubscription::Filters
        if (local.parameters.eventSub.outputs.get()) newEventSub += (1 << 6); // EventSubscription::Outputs
        if (local.parameters.eventSub.sceneItems.get()) newEventSub += (1 << 7); // EventSubscription::SceneItems
        if (local.parameters.eventSub.mediaInputs.get()) newEventSub += (1 << 8); // EventSubscription::MediaInputs
        if (local.parameters.eventSub.vendors.get()) newEventSub += (1 << 9); // EventSubscription::Vendors
        if (local.parameters.eventSub.ui.get()) newEventSub += (1 << 10); // EventSubscription::Ui
        if (local.parameters.eventSub.inputVolumeMeters.get()) newEventSub += (1 << 16); // EventSubscription::InputVolumeMeters
        if (local.parameters.eventSub.inputActiveStateChanged.get()) newEventSub += (1 << 17); // EventSubscription::InputActiveStateChanged
        if (local.parameters.eventSub.inputShowStateChanged.get()) newEventSub += (1 << 18); // EventSubscription::InputShowStateChanged
        if (local.parameters.eventSub.sceneItemTransformChanged.get()) newEventSub += (1 << 19); // EventSubscription::SceneItemTransformChanged

        if (d.authentication != null) {
            var mdp = local.parameters.password.get() + d.authentication.salt;
            var Encode1 = util.toBase64(parseHex(util.encodeSHA256(mdp)));
            var Encode2 = util.toBase64(parseHex(util.encodeSHA256(Encode1 + d.authentication.challenge)));
            local.send('{"d":{"authentication": "' + Encode2 + '", "eventSubscriptions": ' + toDecimal(newEventSub) + ', "rpcVersion": 1}, "op": 1}');
        } else {
            local.send('{"op": 1,"d": {"rpcVersion": 1,"authentication": "Chataigne","eventSubscriptions": ' + toDecimal(newEventSub) + '} }');
        }
    } // else if (obsObj.op == 2) {
    //     //TODO
    //     GetStudioModeEnabled(7);
    //     removeAllValues();
    //     GetSceneList(7);
    //     GetInputList(7);
    //     GetCurrentProgramScene(7);

    // }
    return;

    /* ************ CHANGED VALUES WITH MESSAGE RECEIVED ******************** */
    //GetSceneCollectionList
    if (d.requestType == "GetSceneCollectionList") {
        var n = 0;
        local.values.addContainer("Collections");
        valueStringParameter("CurrentCollection", d.responseData.currentSceneCollectionName);
        while (d.responseData.sceneCollections[n] != null) {
            var collection = d.responseData.sceneCollections[n];
            local.values.getChild("Collections").addStringParameter("Collection" + n, "", collection);
            local.values.getChild("Collections").getChild("Collection" + n).setAttribute("readonly", true);
            n++;
        }
    }

    if (d.requestType == "GetStudioModeEnabled") {
        local.values.controlsStatus.studioModeStatus.set(d.responseData.studioModeEnabled);
        if (d.responseData.studioModeEnabled) {
            GetCurrentPreviewScene(7);
        }
    }
    //GetSceneList
    if (d.requestType == "GetSceneList") {
        var n = 0;
        if (local.values.getChild("Scenes") == null) {
            local.values.addContainer("Scenes");
            EnumScenes = local.values.getChild("Scenes").addEnumParameter("Slct Scene", "The scene selected for controller");
            EnumItems = local.values.getChild("Scenes").addEnumParameter("Slct Item", "The item selected for controller");
        }

        while (d.responseData['scenes'][n].sceneIndex != null) {
            var index = d.responseData['scenes'][n].sceneIndex;
            var scene = d.responseData['scenes'][n].sceneName;
            if (local.values.getChild("Scenes").getChild(scene) == null) {
                local.values.getChild("Scenes").addContainer(scene);
                local.values.getChild("Scenes").getChild(scene).addStringParameter("sceneIndex", "", index);
                local.values.getChild("Scenes").getChild(scene).getChild("sceneIndex").setAttribute("readonly", true);
                local.values.getChild("Scenes").getChild(scene).addStringParameter("sceneName", "", scene);
                local.values.getChild("Scenes").getChild(scene).getChild("sceneName").setAttribute("readonly", true);
            }
            local.values.getChild("Scenes").getChild(scene).getChild("sceneIndex").set(index);
            local.values.getChild("Scenes").getChild(scene).getChild("sceneName").set(scene);
            GetSceneItemList("updateSceneContainer_" + scene, scene);
            OBSSave[scene] = {};
            //local.values.getChild("Scenes").getChild("Slct Scene").addOption(scene,index);
            EnumScenes.addOption(scene, scene);
            n++;
        }
        valueStringParameter("CurrentScene", d.responseData.currentProgramSceneName);
        if (d.responseData.currentPreviewSceneName != null) {
            EnumScenes.set(d.responseData.currentPreviewSceneName);
            GetSceneItemList("active_items_" + d.responseData.currentPreviewSceneName, d.responseData.currentPreviewSceneName);
        } else {
            EnumScenes.set(d.responseData.currentProgramSceneName);
            GetSceneItemList("active_items_" + d.responseData.currentProgramSceneName, d.responseData.currentProgramSceneName);
        }
    }

    //GetInputList
    if (d.requestType == "GetInputList") {
        var n = 0;
        if (local.values.getChild("Inputs") == null) {
            local.values.addContainer("Inputs");
        }
        while (d.responseData['inputs'][n].inputKind != null) {
            var inputKind = d.responseData['inputs'][n].inputKind;
            var inputName = d.responseData['inputs'][n].inputName;
            if (local.values.getChild("Inputs").getChild(inputName) == null) {
                local.values.getChild("Inputs").addContainer(inputName);
                local.values.getChild("Inputs").getChild(inputName).addStringParameter("inputName", "", inputName);
                local.values.getChild("Inputs").getChild(inputName).getChild("inputName").setAttribute("readonly", true);
                local.values.getChild("Inputs").getChild(inputName).addStringParameter("inputKind", "", inputKind);
                local.values.getChild("Inputs").getChild(inputName).getChild("inputKind").setAttribute("readonly", true);
            }
            local.values.getChild("Inputs").getChild(inputName).getChild("inputName").set(inputName);
            local.values.getChild("Inputs").getChild(inputName).getChild("inputKind").set(inputKind);
            n++;
        }
    }

    //GetCurrentProgramScene
    if (d.requestType == "GetCurrentProgramScene") {
        valueStringParameter("CurrentScene", d.responseData.currentProgramSceneName);
        if (!local.values.controlsStatus.studioModeStatus.get()) {
            EnumScenes.set(d.responseData.currentProgramSceneName);
            GetSceneItemList("active_items_" + d.responseData.currentProgramSceneName, d.responseData.currentProgramSceneName);
        }
    }

    //SetCurrentProgramScene
    if (d.requestType == "SetCurrentProgramScene") {
        valueStringParameter("CurrentScene", tempo);
    }

    //GetGroupList
    if (d.requestType == "GetGroupList") {
        var n = 0;
        local.values.addContainer("Groups");
        while (d.responseData.groups[n] != null) {
            var group = d.responseData.groups[n];
            local.values.getChild("Groups").addStringParameter("NameGroup" + n, "", group);
            local.values.getChild("Groups").getChild("NameGroup" + n).setAttribute("readonly", true);
            n++;
        }
    }

    //GetSceneItemList
    if (d.requestType == "GetSceneItemList") {
        var n = 0;
        if (d.requestId.startsWith("updateSceneContainer_")) {
            var scene = d.requestId.replace("updateSceneContainer_", "");
            while (d.responseData['sceneItems'][n].sourceName != null) {
                var sceneItemId = d.responseData['sceneItems'][n].sceneItemId;
                var sourceName = d.responseData['sceneItems'][n].sourceName;
                local.values.getChild("Scenes").getChild(scene).addContainer(sourceName);
                if (local.values.getChild("Scenes").getChild(scene).getChild(sourceName).getChild("IndexItem") == null) {
                    local.values.getChild("Scenes").getChild(scene).getChild(sourceName).addStringParameter("IndexItem", "", sceneItemId);
                    local.values.getChild("Scenes").getChild(scene).getChild(sourceName).getChild("IndexItem").setAttribute("readonly", true);
                } else {
                    local.values.getChild("Scenes").getChild(scene).getChild(sourceName).getChild("IndexItem").set(sceneItemId);
                }
                OBSSave[scene][sourceName] = {};
                OBSSave[scene][sourceName]['sceneItemId'] = sceneItemId;
                n++;
            }
        }

        //Complete EnumScenes and EnumItems menu on scene change
        if (d.requestId.startsWith("active_items_")) {
            EnumItems.removeOptions();
            if (d.responseData['sceneItems'][0]) {
                var n = 0;
                while (d.responseData['sceneItems'][n].sourceName != null) {
                    var sceneItemId = d.responseData['sceneItems'][n].sceneItemId;
                    var sourceName = d.responseData['sceneItems'][n].sourceName;
                    EnumItems.addOption(sourceName, sceneItemId);
                    n++;
                }
                EnumItems.setPrevious(true);
                GetSceneItemTransform('active_item_parameter', EnumScenes.get(), EnumItems.get());
            }
        }

    }

    //GetSceneItemTransform get transform parameters for the active item
    if (d.requestType == "GetSceneItemTransform") {
        if (d.requestId.startsWith("active_item_parameter")) {
            local.values.getChild("Active Item Transform").positionX.set(d.responseData.sceneItemTransform.positionX);
            local.values.getChild("Active Item Transform").positionY.set(d.responseData.sceneItemTransform.positionY);
            local.values.getChild("Active Item Transform").getChild("Zoom").set(d.responseData.sceneItemTransform.scaleX);
            local.values.getChild("Active Item Transform").rotation.set(d.responseData.sceneItemTransform.rotation);
            local.values.getChild("Active Item Transform").cropBottom.set(d.responseData.sceneItemTransform.cropBottom);
            local.values.getChild("Active Item Transform").cropLeft.set(d.responseData.sceneItemTransform.cropLeft);
            local.values.getChild("Active Item Transform").cropRight.set(d.responseData.sceneItemTransform.cropRight);
            local.values.getChild("Active Item Transform").cropTop.set(d.responseData.sceneItemTransform.cropTop);

        }
    }

    //StreamStateChanged Event
    if (d.eventType == "StreamStateChanged") {
        valueBoolContainerParameter("Stream", "outputActive", d.eventData.outputActive);
        valueStringContainerParameter("Stream", "outputState", d.eventData.outputState);
    }
    //RecordStateChanged Event
    if (d.eventType == "RecordStateChanged") {
        valueBoolContainerParameter("Record", "outputActive", d.eventData.outputActive);
        valueStringContainerParameter("Record", "outputState", d.eventData.outputState);
        valueStringContainerParameter("Record", "outputPath", d.eventData.outputPath);
    }
    //CurrentProgramSceneChanged Event
    if (d.eventType == "CurrentProgramSceneChanged") {
        if (!local.values.controlsStatus.studioModeStatus.get()) {
            EnumScenes.set(d.eventData.sceneName);
            GetSceneItemList("active_items_" + d.eventData.sceneName, d.eventData.sceneName);
        }
        valueStringParameter("CurrentScene", d.eventData.sceneName);
    }
    //StudioModeStateChanged Event
    if (d.eventType == "StudioModeStateChanged") {
        local.values.controlsStatus.studioModeStatus.set(d.eventData.studioModeEnabled);
        if (!d.eventData.studioModeEnabled) {
            GetCurrentProgramScene(7);
        }
    }
    //CurrentPreviewSceneChanged Event (need for studio mode)
    if (d.eventType == "CurrentPreviewSceneChanged") {
        EnumScenes.set(d.eventData.sceneName);
        GetSceneItemList("active_items_" + d.eventData.sceneName, d.eventData.sceneName);
    }

    //InputMuteStateChanged
    if (d.eventType == "InputMuteStateChanged") {
        valueBoolContainerParameter("Audio Input", d.eventData.inputName, d.eventData.inputMuted);
    }

    //SceneItemTransformChanged
    if (d.eventType == "SceneItemTransformChanged") {
        if (d.eventData.sceneName == EnumScenes.get() && d.eventData.sceneItemId == local.values.getChild("Scenes").getChild(EnumScenes.get()).getChild(EnumItems.getKey()).getChild("IndexItem").get()) {
            local.values.getChild("Active Item Transform").positionX.set(d.eventData.sceneItemTransform.positionX);
            local.values.getChild("Active Item Transform").positionY.set(d.eventData.sceneItemTransform.positionY);
            local.values.getChild("Active Item Transform").getChild("Zoom").set(d.eventData.sceneItemTransform.scaleX);
            local.values.getChild("Active Item Transform").rotation.set(d.eventData.sceneItemTransform.rotation);
            local.values.getChild("Active Item Transform").cropBottom.set(d.eventData.sceneItemTransform.cropBottom);
            local.values.getChild("Active Item Transform").cropLeft.set(d.eventData.sceneItemTransform.cropLeft);
            local.values.getChild("Active Item Transform").cropRight.set(d.eventData.sceneItemTransform.cropRight);
            local.values.getChild("Active Item Transform").cropTop.set(d.eventData.sceneItemTransform.cropTop);
        }
    }

    if (d.eventType == "SceneItemSelected") {
        var options = EnumItems.getAllOptions();
        var i = 0;
        for (i = 0; i < options.length; i++) {
            if (d.eventData.sceneItemId == options[i].value) {
                EnumItems.set(options[i].key);
                GetSceneItemTransform('active_item_parameter', d.eventData.sceneName, d.eventData.sceneItemId);
            }
        }
    }

    if (d.eventType == "SceneItemCreated") {
        EnumItems.addOption(d.eventData.sourceName, d.eventData.sceneItemId);
        local.values.getChild("Scenes").getChild(d.eventData.sceneName).addContainer(d.eventData.sourceName);
        local.values.getChild("Scenes").getChild(d.eventData.sceneName).getChild(d.eventData.sourceName).addStringParameter("IndexItem", "", d.eventData.sceneItemId);
        local.values.getChild("Scenes").getChild(d.eventData.sceneName).getChild(d.eventData.sourceName).getChild("IndexItem").setAttribute("readonly", true);
    }

    if (d.eventType == "SceneItemRemoved") {
        local.values.getChild("Scenes").getChild(d.eventData.sceneName).removeContainer(d.eventData.sourceName);
    }

    if (d.eventType == "SceneCreated") {
        EnumScenes.addOption(d.eventData.sceneName, d.eventData.sceneName);
        local.values.getChild("Scenes").addContainer(d.eventData.sceneName);
    }

    if (d.eventType == "SceneRemoved") {
        local.values.getChild("Scenes").removeContainer(d.eventData.sceneName);
    }

    if (d.eventType == "SceneNameChanged") {
        local.values.getChild("Scenes").getChild(d.eventData.oldSceneName).setName(d.eventData.sceneName);
        local.values.getChild("Scenes").getChild(d.eventData.sceneName).getChild("sceneName").set(d.eventData.sceneName);
        GetSceneList(7);
    }

    if (d.eventType == "InputCreated") {
        local.values.getChild("Inputs").addContainer(d.eventData.inputName);
        local.values.getChild("Inputs").getChild(d.eventData.inputName).addStringParameter("inputName", "", d.eventData.inputName);
        local.values.getChild("Inputs").getChild(d.eventData.inputName).getChild("inputName").setAttribute("readonly", true);
        local.values.getChild("Inputs").getChild(d.eventData.inputName).addStringParameter("inputKind", "", d.eventData.inputKind);
        local.values.getChild("Inputs").getChild(d.eventData.inputName).getChild("inputKind").setAttribute("readonly", true);
    }

    if (d.eventType == "InputRemoved") {
        local.values.getChild("Inputs").removeContainer(d.eventData.inputName);
    }

    if (d.eventType == "InputNameChanged") {
        var tempoEnumItem = EnumItems.getKey();
        local.values.getChild("Inputs").getChild(d.eventData.oldInputName).getChild("inputName").set(d.eventData.inputName);
        local.values.getChild("Inputs").getChild(d.eventData.oldInputName).setName(d.eventData.inputName);
        var sceneList = util.getObjectProperties(local.values.getChild("Scenes"), true, false);
        for (var i = 0; i < sceneList.length; i++) {
            if (sceneList[i] != "slctScene" && sceneList[i] != "slctItem") {
                if (local.values.getChild("Scenes")[sceneList[i]].getChild(d.eventData.oldInputName) != null) {
                    local.values.getChild("Scenes")[sceneList[i]].getChild(d.eventData.oldInputName).setName(d.eventData.inputName);
                }
            }
        }
        GetSceneItemList("active_items_" + EnumScenes.get(), EnumScenes.get());
        util.delayThreadMS(500);
        EnumItems.set(tempoEnumItem);
    }
}

function wsDataReceived(data) {
    script.log("Websocket data received : " + data);
}

/* ********** STREAMING MODULE (UDP, TCP, SERIAL, WEBSOCKET) SPECIFIC SCRIPTING ********************* */
/*

Websoskets modules can be used as standard Streaming Module and use the dataReceived function above, 
but you can also intercept messages and data directly from the streaming, before it is processed, using specific 
event callbacks below
*/


//---------------------------------------------------------------------------------
/*send requests*/
function sendObsCommand(req, data, reqId) {
    var send = {};
    var para = {};
    para["requestType"] = req;
    para["requestId"] = reqId;
    para["requestData"] = data;

    /*!== undefined ? data : {}*/
    send["op"] = 6;
    send["d"] = para;

    local.send(JSON.stringify(send));
}

function sendObsRawCommand(json) {
    local.send(json);
}

//---------------------------------------------------------------------------------
/*General Requests Menu*/
function GetVersion(reqId) {
    var data = {};
    sendObsCommand("GetVersion", data, reqId);
}

function GetStats(reqId) {
    var data = {};
    sendObsCommand("GetStats", data, reqId);
}

function BroadcastCustomEvent(reqId) {
    var data = {};
    sendObsCommand("BroadcastCustomEvent", data, reqId);
}

function CallVendorRequest(reqId, vendorName, requestType, requestData) {
    var data = {};
    data["vendorName"] = vendorName;
    data["requestType"] = requestType;
    data["requestData"] = JSON.parse(requestData);
    sendObsCommand("CallVendorRequest", data, reqId);
}

function GetHotkeyList(reqId) {
    var data = {};
    sendObsCommand("GetHotkeyList", data, reqId);
}

function TriggerHotkeyByName(reqId, hotkeyName) {
    var data = {};
    data["hotkeyName"] = hotkeyName;
    sendObsCommand("TriggerHotkeyByName", data, reqId);
}

function TriggerHotkeyByKeySequence(reqId, keyId, shift, control, alt, command) {
    var data = {
        "keyId": keyId,
        "keyModifiers": {
            "shift": shift,
            "control": control,
            "alt": alt,
            "command": command
        }
    };
    sendObsCommand("TriggerHotkeyByKeySequence", data, reqId);
}

//---------------------------------------------------------------------------------
/*Config requests Menu*/
function Sleep(reqId, sleepMillis, sleepFrames) {
    var data = {};
    data["sleepMillis"] = sleepMillis;
    data["sleepFrames"] = sleepFrames;
    sendObsCommand("Sleep", data, reqId);
}

function GetPersistentData(reqId, realm, slotName) {
    var data = {};
    data["realm"] = realm;
    data["slotName"] = slotName;
    sendObsCommand("GetPersistentData", data, reqId);
}

function SetPersistentData(reqId, realm, slotName, slotValue) {
    var data = {};
    data["realm"] = realm;
    data["slotName"] = slotName;
    data["slotValue"] = slotValue;
    sendObsCommand("SetPersistentData", data, reqId);
}

function GetSceneCollectionList(reqId) {
    var data = {};
    sendObsCommand("GetSceneCollectionList", data, reqId);
}

function SetCurrentSceneCollection(reqId, sceneCollectionName) {
    var data = {};
    data["sceneCollectionName"] = sceneCollectionName;
    sendObsCommand("SetCurrentSceneCollection", data, reqId);
}

function CreateSceneCollection(reqId, sceneCollectionName) {
    var data = {};
    data["sceneCollectionName"] = sceneCollectionName;
    sendObsCommand("CreateSceneCollection", data, reqId);
}

function GetProfileList(reqId) {
    var data = {};
    sendObsCommand("GetProfileList", data, reqId);
}

function SetCurrentProfile(reqId, profileName) {
    var data = {};
    data["profileName"] = profileName;
    sendObsCommand("SetCurrentProfile", data, reqId);
}

function CreateProfile(reqId, profileName) {
    var data = {};
    data["profileName"] = profileName;
    sendObsCommand("CreateProfile", data, reqId);
}

function RemoveProfile(reqId, profileName) {
    var data = {};
    data["profileName"] = profileName;
    sendObsCommand("RemoveProfile", data, reqId);
}

function GetProfileParameter(reqId, parameterCategory, parameterName) {
    var data = {};
    data["parameterCategory"] = parameterCategory;
    data["parameterName"] = parameterName;
    sendObsCommand("GetProfileParameter", data, reqId);
}

function SetProfileParameter(reqId, parameterCategory, parameterName, parameterValue) {
    var data = {};
    data["parameterCategory"] = parameterCategory;
    data["parameterName"] = parameterName;
    data["parameterValue"] = parameterValue;
    sendObsCommand("SetProfileParameter", data, reqId);
}

function GetVideoSettings(reqId) {
    var data = {};
    sendObsCommand("GetVideoSettings", data, reqId);
}

function SetVideoSettings(reqId, fpsNumerator, fpsDenominator, baseWidth, baseHeight, outputWidth, outputHeight) {
    var data = {};
    data["fpsNumerator"] = fpsNumerator;
    data["fpsDenominator"] = fpsDenominator;
    data["parametbaseWidtherValue"] = baseWidth;
    data["baseHeight"] = baseHeight;
    data["outputWidth"] = outputWidth;
    data["outputHeight"] = outputHeight;
    sendObsCommand("SetVideoSettings", data, reqId);
}

function GetStreamServiceSettings(reqId) {
    var data = {};
    sendObsCommand("GetStreamServiceSettings", data, reqId);
}

function SetStreamServiceSettings(reqId, streamServiceType, streamServiceSettings) {
    var data = {};
    data["streamServiceType"] = streamServiceType;
    data["streamServiceSettings"] = JSON.parse(streamServiceSettings);
    sendObsCommand("SetStreamServiceSettings", data, reqId);
}

function GetRecordDirectory(reqId) {
    var data = {};
    sendObsCommand("GetRecordDirectory", data, reqId);
}

//---------------------------------------------------------------------------------
/*Sources Requests Menu*/
function GetSourceActive(reqId, sourceName) {
    var data = {};
    data["sourceName"] = sourceName;
    sendObsCommand("GetSourceActive", data, reqId);
}

function GetSourceScreenshot(reqId, sourceName, imageFormat, imageWidth, imageHeight, imageCompressionQuality) {
    var data = {};
    data["sourceName"] = sourceName;
    data["imageFormat"] = imageFormat;
    data["imageWidth"] = imageWidth;
    data["imageHeight"] = imageHeight;
    data["imageCompressionQuality"] = imageCompressionQuality;
    sendObsCommand("GetSourceScreenshot", data, reqId);
}

function SaveSourceScreenshot(reqId, sourceName, imageFormat, imageFilePath, imageWidth, imageHeight, imageCompressionQuality) {
    var data = {};
    data["sourceName"] = sourceName;
    data["imageFormat"] = imageFormat;
    data["imageFilePath"] = imageFilePath;
    data["imageWidth"] = imageWidth;
    data["imageHeight"] = imageHeight;
    data["imageCompressionQuality"] = imageCompressionQuality;
    sendObsCommand("SaveSourceScreenshot", data, reqId);
}

//---------------------------------------------------------------------------------
/*Scenes Requests menu*/
function GetSceneList(reqId) {
    var data = {};
    sendObsCommand("GetSceneList", data, reqId);

}

function GetGroupList(reqId) {
    var data = {};
    sendObsCommand("GetGroupList", data, reqId);
}

function GetCurrentProgramScene(reqId) {
    var data = {};
    sendObsCommand("GetCurrentProgramScene", data, reqId);
}

function SetCurrentProgramScene(reqId, sceneName) {
    var data = {};
    tempo = sceneName;
    data["sceneName"] = sceneName;
    sendObsCommand("SetCurrentProgramScene", data, reqId);
}

function GetCurrentPreviewScene(reqId) {
    var data = {};
    sendObsCommand("GetCurrentPreviewScene", data, reqId);
}

function SetCurrentPreviewScene(reqId, sceneName) {
    var data = {};
    data["sceneName"] = sceneName;
    sendObsCommand("SetCurrentPreviewScene", data, reqId);
}

function CreateScene(reqId, sceneName) {
    var data = {};
    data["sceneName"] = sceneName;
    sendObsCommand("CreateScene", data, reqId);
}

function RemoveScene(reqId, sceneName) {
    var data = {};
    data["sceneName"] = sceneName;
    sendObsCommand("RemoveScene", data, reqId);
}

function SetSceneName(reqId, sceneName, newSceneName) {
    var data = {};
    data["sceneName"] = sceneName;
    data["newSceneName"] = newSceneName;
    sendObsCommand("SetSceneName", data, reqId);
}

function GetSceneSceneTransitionOverride(reqId, sceneName) {
    var data = {};
    data["sceneName"] = sceneName;
    sendObsCommand("GetSceneSceneTransitionOverride", data, reqId);
}

function SetSceneSceneTransitionOverride(reqId, sceneName, transitionName, transitionDuration) {
    var data = {};
    data["sceneName"] = sceneName;
    data["transitionName"] = transitionName;
    data["transitionDuration"] = transitionDuration;
    sendObsCommand("SetSceneSceneTransitionOverride", data, reqId);
}

//---------------------------------------------------------------------------------
/*Inputs Requests menu*/
function GetInputList(reqId, inputKind) {
    var data = {};
    if (data["inputKind"] != undefined) {
        data["inputKind"] = inputKind;
    } else {

        data["inputKind"] = null;
    }
    sendObsCommand("GetInputList", data, reqId);
}

function GetInputKindList(reqId, unversioned) {
    var data = {};
    data["unversioned"] = unversioned;
    sendObsCommand("GetInputKindList", data, reqId);
}

function GetSpecialInputs(reqId) {
    var data = {};
    sendObsCommand("GetSpecialInputs", data, reqId);
}

function CreateInput(reqId, sceneName, inputName, inputKind, inputSettings, sceneItemEnabled) {
    var data = {};
    data["sceneName"] = sceneName;
    data["inputName"] = inputName;
    data["inputKind"] = inputKind;
    data["inputSettings"] = JSON.parse(inputSettings);
    data["sceneItemEnabled"] = sceneItemEnabled;
    sendObsCommand("CreateInput", data, reqId);
}

function RemoveInput(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("RemoveInput", data, reqId);
}

function SetInputName(reqId, inputName, newInputName) {
    var data = {};
    data["inputName"] = inputName;
    data["newInputName"] = newInputName;
    sendObsCommand("SetInputName", data, reqId);
}

function GetInputDefaultSettings(reqId, inputKind) {
    var data = {};
    data["inputKind"] = inputKind;
    sendObsCommand("GetInputDefaultSettings", data, reqId);
}

function GetInputSettings(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("GetInputSettings", data, reqId);
}

function SetInputSettings(reqId, inputName, inputSettings, overlay) {
    var data = {};
    data["inputName"] = inputName;
    data["inputSettings"] = JSON.parse(inputSettings);
    data["overlay"] = overlay;
    sendObsCommand("SetInputSettings", data, reqId);
}

function GetInputMute(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("GetInputMute", data, reqId);
}

function SetInputMute(reqId, inputName, inputMuted) {
    var data = {};
    data["inputName"] = inputName;
    data["inputMuted"] = inputMuted;
    sendObsCommand("SetInputMute", data, reqId);
}

function ToggleInputMute(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("ToggleInputMute", data, reqId);
}

function GetInputVolume(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("GetInputVolume", data, reqId);
}

function SetInputVolume(reqId, inputName, Dbsettings, inputVolumeMul, inputVolumeDb) {
    var data = {};
    data["inputName"] = inputName;

    if (Dbsettings == false) {
        data["inputVolumeMul"] = inputVolumeMul;
    } else if (Dbsettings == true) {
        data["inputVolumeDb"] = inputVolumeDb;
    }
    sendObsCommand("SetInputVolume", data, reqId);
}

function GetInputAudioBalance(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("GetInputAudioBalance", data, reqId);
}

function SetInputAudioBalance(reqId, inputName, inputAudioBalance) {
    var data = {};
    data["inputName"] = inputName;
    data["inputAudioBalance"] = inputAudioBalance;
    sendObsCommand("SetInputAudioBalance", data, reqId);
}

function GetInputAudioSyncOffset(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("GetInputAudioSyncOffset", data, reqId);
}

function SetInputAudioSyncOffset(reqId, inputName, inputAudioSyncOffset) {
    var data = {};
    data["inputName"] = inputName;
    data["inputAudioSyncOffset"] = inputAudioSyncOffset;
    sendObsCommand("SetInputAudioSyncOffset", data, reqId);
}

function GetInputAudioMonitorType(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("GetInputAudioMonitorType", data, reqId);
}

function SetInputAudioMonitorType(reqId, inputName, monitorType) {
    var data = {};
    data["inputName"] = inputName;
    data["monitorType"] = monitorType;
    sendObsCommand("SetInputAudioMonitorType", data, reqId);
}

function GetInputAudioTracks(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("GetInputAudioTracks", data, reqId);
}

function SetInputAudioTracks(reqId, inputName, inputAudioTracks) {
    var data = {};
    data["inputName"] = inputName;
    data["inputAudioTracks"] = JSON.parse(inputAudioTracks);
    sendObsCommand("SetInputAudioTracks", data, reqId);
}

function GetInputPropertiesListPropertyItems(reqId, inputName, propertyName) {
    var data = {};
    data["inputName"] = inputName;
    data["propertyName"] = propertyName;
    sendObsCommand("GetInputPropertiesListPropertyItems", data, reqId);
}

function PressInputPropertiesButton(reqId, inputName, propertyName) {
    var data = {};
    data["inputName"] = inputName;
    data["propertyName"] = propertyName;
    sendObsCommand("PressInputPropertiesButton", data, reqId);
}

//---------------------------------------------------------------------------------
/*Transitions Requests menu*/
function GetTransitionKindList(reqId, transitionKinds) {
    var data = {};
    data["transitionKinds"] = transitionKinds;
    sendObsCommand("GetTransitionKindList", data, reqId);
}

function GetSceneTransitionList(reqId, currentSceneTransitionName, currentSceneTransitionKind, transitions) {
    var data = {};
    data["currentSceneTransitionName"] = currentSceneTransitionName;
    data["currentSceneTransitionKind"] = currentSceneTransitionKind;
    data["transitions"] = transitions;
    sendObsCommand("GetSceneTransitionList", data, reqId);
}

function GetCurrentSceneTransition(reqId, transitionName, transitionKind, transitionFixed, transitionDuration, transitionConfigurable, transitionSettings) {
    var data = {};
    data["transitionName"] = transitionName;
    data["transitionKind"] = transitionKind;
    data["transitionFixed"] = transitionFixed;
    data["transitionDuration"] = transitionDuration;
    data["transitionConfigurable"] = transitionConfigurable;
    data["transitionSettings"] = transitionSettings;
    sendObsCommand("GetCurrentSceneTransition", data, reqId);
}

function SetCurrentSceneTransition(reqId, transitionName) {
    var data = {};
    data["transitionName"] = transitionName;
    sendObsCommand("SetCurrentSceneTransition", data, reqId);
}

function SetCurrentSceneTransitionDuration(reqId, transitionDuration) {
    var data = {};
    data["transitionDuration"] = transitionDuration;
    sendObsCommand("SetCurrentSceneTransitionDuration", data, reqId);
}

function SetCurrentSceneTransitionSettings(reqId, transitionSettings, overlay) {
    var data = {};
    data["transitionSettings"] = JSON.parse(transitionSettings);
    data["overlay"] = overlay;
    sendObsCommand("SetCurrentSceneTransitionSettings", data, reqId);
}

function GetCurrentSceneTransitionCursor(reqId, transitionCursor) {
    var data = {};
    data["transitionCursor"] = transitionCursor;
    sendObsCommand("GetCurrentSceneTransitionCursor", data, reqId);
}

function TriggerStudioModeTransition(reqId) {
    var data = {};
    sendObsCommand("TriggerStudioModeTransition", data, reqId);
}

function SetTBarPosition(reqId, position, release) {
    var data = {};
    data["position"] = position;
    data["release"] = release;
    sendObsCommand("SetTBarPosition", data, reqId);
}

//---------------------------------------------------------------------------------
/*Filters Requests menu*/
function GetSourceFilterList(reqId, sourceName) {
    var data = {};
    data["sourceName"] = sourceName;
    sendObsCommand("GetSourceFilterList", data, reqId);
}

function GetSourceFilterDefaultSettings(reqId, filterKind) {
    var data = {};
    data["filterKind"] = filterKind;
    sendObsCommand("GetSourceFilterDefaultSettings", data, reqId);
}

function CreateSourceFilter(reqId, sourceName, filterName, filterKind, filterSettings) {
    var data = {};
    data["sourceName"] = sourceName;
    data["filterName"] = filterName;
    data["filterKind"] = filterKind;
    data["filterSettings"] = JSON.parse(filterSettings);
    sendObsCommand("CreateSourceFilter", data, reqId);
}

function RemoveSourceFilter(reqId, sourceName, filterName) {
    var data = {};
    data["sourceName"] = sourceName;
    data["filterName"] = filterName;
    sendObsCommand("RemoveSourceFilter", data, reqId);
}

function SetSourceFilterName(reqId, sourceName, filterName, newFilterName) {
    var data = {};
    data["sourceName"] = sourceName;
    data["filterName"] = filterName;
    data["newFilterName"] = newFilterName;
    sendObsCommand("SetSourceFilterName", data, reqId);
}

function GetSourceFilter(reqId, sourceName, filterName) {
    var data = {};
    data["sourceName"] = sourceName;
    data["filterName"] = filterName;
    sendObsCommand("GetSourceFilter", data, reqId);
}

function SetSourceFilterIndex(reqId, sourceName, filterName, filterIndex) {
    var data = {};
    data["sourceName"] = sourceName;
    data["filterName"] = filterName;
    data["filterIndex"] = filterIndex;
    sendObsCommand("SetSourceFilterIndex", data, reqId);
}

function SetSourceFilterSettings(reqId, sourceName, filterName, filterSettings, overlay) {
    var data = {};
    data["sourceName"] = sourceName;
    data["filterName"] = filterName;
    data["filterSettings"] = JSON.parse(filterSettings);
    data["overlay"] = overlay;
    sendObsCommand("SetSourceFilterSettings", data, reqId);
}

function SetSourceFilterColorCorrectionSettings(reqId, sourceName, filterName, gamma, contrast, brightness, saturation, hue, opacity, colorMultiply, colorAdd, overlay) {
    var data = {};
    data["sourceName"] = sourceName;
    data["filterName"] = filterName;
    data["filterSettings"] = {
        "gamma": gamma,
        "contrast": contrast,
        "brightness": brightness,
        "saturation": saturation,
        "hue_shift": hue,
        "opacity": opacity,
        "color_multiply": colorToInt(colorMultiply),
        "color_add": colorToInt(colorAdd)
    };
    data["overlay"] = overlay;
    sendObsCommand("SetSourceFilterSettings", data, reqId);
}

function SetSourceFilterEnabled(reqId, sourceName, filterName, filterEnabled) {
    var data = {};
    data["sourceName"] = sourceName;
    data["filterName"] = filterName;
    data["filterEnabled"] = filterEnabled;
    sendObsCommand("SetSourceFilterEnabled", data, reqId);
}

//---------------------------------------------------------------------------------
/*Scene Items Requests Menu*/
function GetSceneItemList(reqId, sceneName) {
    var data = {};
    tempo = sceneName;
    data["sceneName"] = sceneName;
    sendObsCommand("GetSceneItemList", data, reqId);
}

function GetGroupSceneItemList(reqId, sceneName) {
    var data = {};
    data["sceneName"] = sceneName;
    sendObsCommand("GetGroupSceneItemList", data, reqId);
}

function GetSceneItemId(reqId, sceneName, sourceName, searchOffset) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sourceName"] = sourceName;
    data["searchOffset"] = searchOffset;
    sendObsCommand("GetSceneItemId", data, reqId);
}

function CreateSceneItem(reqId, sceneName, sourceName, sceneItemEnabled) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sourceName"] = sourceName;
    data["sceneItemEnabled"] = sceneItemEnabled;
    sendObsCommand("CreateSceneItem", data, reqId);
}

function RemoveSceneItem(reqId, sceneName, sceneItemId) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    sendObsCommand("RemoveSceneItem", data, reqId);
}

function DuplicateSceneItem(reqId, sceneName, destinationSceneName) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneId"] = sceneId;
    data["destinationSceneName"] = destinationSceneName;
    sendObsCommand("DuplicateSceneItem", data, reqId);
}

function GetSceneItemTransform(reqId, sceneName, sceneItemId) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    sendObsCommand("GetSceneItemTransform", data, reqId);
}

function SetSceneItemTransform(reqId, sceneName, sceneItemId, positionXBool, positionX, positionYBool, positionY, scaleXBool, scaleX, scaleYBool, scaleY, rotationBool, rotation, cropBottomBool, cropBottom, cropTopBool, cropTop, cropLeftBool, cropLeft, cropRightBool, cropRight) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    //
    data["sceneItemTransform"] = {};
    if (positionXBool == true) {
        data["sceneItemTransform"]["positionX"] = positionX;
    }
    if (positionYBool == true) {
        data["sceneItemTransform"]["positionY"] = positionY;
    }
    if (scaleXBool == true) {
        data["sceneItemTransform"]["scaleX"] = scaleX;
    }
    if (scaleYBool == true) {
        data["sceneItemTransform"]["scaleY"] = scaleY;
    }
    // Completing transform parameters for an OBS item
    if (rotationBool == true) {
        data["sceneItemTransform"]["rotation"] = rotation;
    }
    if (cropBottomBool == true) {
        data["sceneItemTransform"]["cropBottom"] = cropBottom;
    }
    if (cropTopBool == true) {
        data["sceneItemTransform"]["cropTop"] = cropTop;
    }
    if (cropLeftBool == true) {
        data["sceneItemTransform"]["cropLeft"] = cropLeft;
    }
    if (cropRightBool == true) {
        data["sceneItemTransform"]["cropRight"] = cropRight;
    }
    //data["sceneItemTransform"] = JSON.parse(sceneItemTransform);
    sendObsCommand("SetSceneItemTransform", data, reqId);
}

function GetSceneItemEnabled(reqId, sceneName, sceneItemId) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    sendObsCommand("GetSceneItemEnabled", data, reqId);
}

function SetSceneItemEnabled(reqId, sceneName, sceneItemId, sceneItemEnabled) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    data["sceneItemEnabled"] = sceneItemEnabled;
    sendObsCommand("SetSceneItemEnabled", data, reqId);
}

function GetSceneItemLocked(reqId, sceneName, sceneItemId) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    sendObsCommand("GetSceneItemLocked", data, reqId);
}

function SetSceneItemLocked(reqId, sceneName, sceneItemId, sceneItemLocked) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    data["sceneItemLocked"] = sceneItemLocked;
    sendObsCommand("SetSceneItemLocked", data, reqId);
}

function GetSceneItemIndex(reqId, sceneName, sceneItemId) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    sendObsCommand("GetSceneItemIndex", data, reqId);
}

function SetSceneItemIndex(reqId, sceneName, sceneItemId, sceneItemIndex) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    data["sceneItemIndex"] = sceneItemIndex;
    sendObsCommand("SetSceneItemIndex", data, reqId);
}

function GetSceneItemBlendMode(reqId, sceneName, sceneItemId) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    sendObsCommand("GetSceneItemBlendMode", data, reqId);
}

function SetSceneItemBlendMode(reqId, sceneName, sceneItemId, sceneItemBlendMode) {
    var data = {};
    data["sceneName"] = sceneName;
    data["sceneItemId"] = sceneItemId;
    data["sceneItemBlendMode"] = sceneItemBlendMode;
    sendObsCommand("SetSceneItemBlendMode", data, reqId);
}

//---------------------------------------------------------------------------------
/*Outputs Requests Menu*/
function GetVirtualCamStatus(reqId) {
    var data = {};
    sendObsCommand("GetVirtualCamStatus", data, reqId);
}

function ToggleVirtualCam(reqId) {
    var data = {};
    sendObsCommand("ToggleVirtualCam", data, reqId);
}

function StartVirtualCam(reqId) {
    var data = {};
    sendObsCommand("StartVirtualCam", data, reqId);
}


function StopVirtualCam(reqId) {
    var data = {};
    sendObsCommand("StopVirtualCam", data, reqId);
}

function GetReplayBufferStatus(reqId) {
    var data = {};
    sendObsCommand("GetReplayBufferStatus", data, reqId);
}

function ToggleReplayBuffer(reqId) {
    var data = {};
    sendObsCommand("ToggleReplayBuffer", data, reqId);
}

function StartReplayBuffer(reqId) {
    var data = {};
    sendObsCommand("StartReplayBuffer", data, reqId);
}

function StopReplayBuffer(reqId) {
    var data = {};
    sendObsCommand("StopReplayBuffer", data, reqId);
}

function SaveReplayBuffer(reqId) {
    var data = {};
    sendObsCommand("SaveReplayBuffer", data, reqId);
}

function GetLastReplayBufferReplay(reqId) {
    var data = {};
    sendObsCommand("GetLastReplayBufferReplay", data, reqId);
}

function GetOutputList(reqId) {
    var data = {};
    sendObsCommand("GetOutputList", data, reqId);
}

function GetOutputStatus(reqId, outputName) {
    var data = {};
    data["outputName"] = outputName;
    sendObsCommand("GetOutputStatus", data, reqId);
}

function ToggleOutput(reqId, outputName) {
    var data = {};
    data["outputName"] = outputName;
    sendObsCommand("ToggleOutput", data, reqId);
}

function StartOutput(reqId, outputName) {
    var data = {};
    data["outputName"] = outputName;
    sendObsCommand("StartOutput", data, reqId);
}

function StopOutput(reqId, outputName) {
    var data = {};
    data["outputName"] = outputName;
    sendObsCommand("StopOutput", data, reqId);
}

function GetOutputSettings(reqId, outputName) {
    var data = {};
    data["outputName"] = outputName;
    sendObsCommand("GetOutputSettings", data, reqId);
}

function SetOutputSettings(reqId, outputName, outputSettings) {
    var data = {};
    data["outputName"] = outputName;
    data["outputSettings"] = JSON.parse(outputSettings);
    sendObsCommand("SetOutputSettings", data, reqId);
}

//---------------------------------------------------------------------------------
/*Stream Requests Menu*/
function GetStreamStatus(reqId) {
    var data = {};
    sendObsCommand("GetStreamStatus", data, reqId);
}

function ToggleStream(reqId) {
    var data = {};
    sendObsCommand("ToggleStream", data, reqId);
}


function StartStream(reqId) {
    var data = {};
    sendObsCommand("StartStream", data, reqId);
}

function StopStream(reqId) {
    var data = {};
    sendObsCommand("StopStream", data, reqId);
}

function SendStreamCaption(reqId, captionText) {
    var data = {};
    data["captionText"] = captionText;
    sendObsCommand("SendStreamCaption", data, reqId);
}

//---------------------------------------------------------------------------------
/*Record Requests Menu*/
function GetRecordStatus(reqId) {
    var data = {};
    sendObsCommand("GetRecordStatus", data, reqId);
}

function ToggleRecord(reqId) {
    var data = {};
    sendObsCommand("ToggleRecord", data, reqId);
}

function StartRecord(reqId) {
    var data = {};
    sendObsCommand("StartRecord", data, reqId);
}

function StopRecord(reqId) {
    var data = {};
    sendObsCommand("StopRecord", data, reqId);
}

function ToggleRecordPause(reqId) {
    var data = {};
    sendObsCommand("ToggleRecordPause", data, reqId);
}

function PauseRecord(reqId) {
    var data = {};
    sendObsCommand("PauseRecord", data, reqId);
}

function ResumeRecord(reqId) {
    var data = {};
    sendObsCommand("ResumeRecord", data, reqId);
}

//---------------------------------------------------------------------------------
/*Media Inputs Requests Menu*/
function GetMediaInputStatus(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("GetMediaInputStatus", data, reqId);
}

function SetMediaInputCursor(reqId, inputName, mediaCursor) {
    var data = {};
    data["inputName"] = inputName;
    data["mediaCursor"] = mediaCursor;
    sendObsCommand("SetMediaInputCursor", data, reqId);
}

function OffsetMediaInputCursor(reqId, inputName, mediaCursorOffset) {
    var data = {};
    data["inputName"] = inputName;
    data["mediaCursorOffset"] = mediaCursorOffset;
    sendObsCommand("OffsetMediaInputCursor", data, reqId);
}

function TriggerMediaInputAction(reqId, inputName, mediaAction) {
    var data = {};
    data["inputName"] = inputName;
    data["mediaAction"] = mediaAction;
    sendObsCommand("TriggerMediaInputAction", data, reqId);
}

//---------------------------------------------------------------------------------
/*UI Requests Menu*/
function GetStudioModeEnabled(reqId) {
    var data = {};
    sendObsCommand("GetStudioModeEnabled", data, reqId);
}

function SetStudioModeEnabled(reqId, studioModeEnabled) {
    var data = {};
    data["studioModeEnabled"] = studioModeEnabled;
    sendObsCommand("SetStudioModeEnabled", data, reqId);
}

function OpenInputPropertiesDialog(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("OpenInputPropertiesDialog", data, reqId);
}

function OpenInputFiltersDialog(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("OpenInputFiltersDialog", data, reqId);
}

function OpenInputInteractDialog(reqId, inputName) {
    var data = {};
    data["inputName"] = inputName;
    sendObsCommand("OpenInputInteractDialog", data, reqId);
}

function GetMonitorList(reqId) {
    var data = {};
    sendObsCommand("GetMonitorList", data, reqId);
}

function OpenVideoMixProjector(reqId, videoMixType, monitorIndex, projectorGeometry) {
    var data = {};
    data["videoMixType"] = videoMixType;
    data["monitorIndex"] = monitorIndex;
    data["projectorGeometry"] = projectorGeometry;
    sendObsCommand("OpenVideoMixProjector", data, reqId);
}

function OpenSourceProjector(reqId, sourceName, monitorIndex, projectorGeometry) {
    var data = {};
    data["sourceName"] = sourceName;
    data["monitorIndex"] = monitorIndex;
    data["projectorGeometry"] = projectorGeometry;
    sendObsCommand("OpenSourceProjector", data, reqId);
}

function SwitchActiveItem(direction) {
    if (local.values.controlsStatus.controllerStatus.get()) {
        if (direction == "Next") {
            EnumScenes.setNext(true);
        } else {
            EnumScenes.setPrevious(true);
        }
        GetSceneItemList("active_items_" + EnumScenes.get(), EnumScenes.get());
    } else {
        if (direction == "Next") {
            EnumItems.setNext(true);
        } else {
            EnumItems.setPrevious(true);
        }
        GetSceneItemTransform('active_item_parameter', EnumScenes.get(), EnumItems.get());
    }
}

function ActiveItemTransform(negative, position_type) {
    var data = {};
    data["sceneName"] = EnumScenes.get();
    data["sceneItemId"] = EnumItems.get();
    data["sceneItemTransform"] = {};
    var step = local.values.getChild("Active Item Transform").getChild("Steppers").x_Y_Crop_RotStep.get();
    if (position_type == "Zoom") {
        step = local.values.getChild("Active Item Transform").getChild("Steppers").zoomStep.get();
        if (negative) {
            step = -1 * step;
        }
        data["sceneItemTransform"]["scaleX"] = local.values.getChild("Active Item Transform").getChild("Zoom").get() + step;
        data["sceneItemTransform"]["scaleY"] = local.values.getChild("Active Item Transform").getChild("Zoom").get() + step;
    } else {
        if (negative) {
            step = -1 * step;
        }
        var position = local.values.getChild("Active Item Transform")[position_type].get() + step;
        data["sceneItemTransform"][position_type] = position;
    }
    sendObsCommand("SetSceneItemTransform", data, "transformDelta");
}

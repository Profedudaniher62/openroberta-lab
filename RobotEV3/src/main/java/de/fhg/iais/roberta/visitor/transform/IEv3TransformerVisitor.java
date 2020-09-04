package de.fhg.iais.roberta.visitor.transform;

import de.fhg.iais.roberta.syntax.Phrase;
import de.fhg.iais.roberta.syntax.action.display.ClearDisplayAction;
import de.fhg.iais.roberta.syntax.action.display.ShowTextAction;
import de.fhg.iais.roberta.syntax.action.light.LightAction;
import de.fhg.iais.roberta.syntax.action.light.LightStatusAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorGetPowerAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorOnAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorSetPowerAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorStopAction;
import de.fhg.iais.roberta.syntax.action.motor.differential.CurveAction;
import de.fhg.iais.roberta.syntax.action.motor.differential.DriveAction;
import de.fhg.iais.roberta.syntax.action.motor.differential.MotorDriveStopAction;
import de.fhg.iais.roberta.syntax.action.motor.differential.TurnAction;
import de.fhg.iais.roberta.syntax.action.sound.PlayFileAction;
import de.fhg.iais.roberta.syntax.action.sound.PlayNoteAction;
import de.fhg.iais.roberta.syntax.action.sound.ToneAction;
import de.fhg.iais.roberta.syntax.action.sound.VolumeAction;
import de.fhg.iais.roberta.visitor.ITransformerVisitor;
import de.fhg.iais.roberta.visitor.hardware.IEv3Visitor;

public interface IEv3TransformerVisitor<V> extends ITransformerVisitor<V>, IEv3Visitor<Phrase<V>> {

    // unrelated defaults

    @Override
    default Phrase<V> visitMotorGetPowerAction(MotorGetPowerAction<Phrase<V>> motorGetPowerAction) {
        return ITransformerVisitor.super.visitMotorGetPowerAction(motorGetPowerAction);
    }

    @Override
    default Phrase<V> visitMotorSetPowerAction(MotorSetPowerAction<Phrase<V>> motorSetPowerAction) {
        return ITransformerVisitor.super.visitMotorSetPowerAction(motorSetPowerAction);
    }

    @Override
    default Phrase<V> visitDriveAction(DriveAction<Phrase<V>> driveAction) {
        return ITransformerVisitor.super.visitDriveAction(driveAction);
    }

    @Override
    default Phrase<V> visitCurveAction(CurveAction<Phrase<V>> curveAction) {
        return ITransformerVisitor.super.visitCurveAction(curveAction);
    }

    @Override
    default Phrase<V> visitTurnAction(TurnAction<Phrase<V>> turnAction) {
        return ITransformerVisitor.super.visitTurnAction(turnAction);
    }

    @Override
    default Phrase<V> visitMotorDriveStopAction(MotorDriveStopAction<Phrase<V>> stopAction) {
        return ITransformerVisitor.super.visitMotorDriveStopAction(stopAction);
    }

    @Override
    default Phrase<V> visitMotorOnAction(MotorOnAction<Phrase<V>> motorOnAction) {
        return ITransformerVisitor.super.visitMotorOnAction(motorOnAction);
    }

    @Override
    default Phrase<V> visitMotorStopAction(MotorStopAction<Phrase<V>> motorStopAction) {
        return ITransformerVisitor.super.visitMotorStopAction(motorStopAction);
    }

    @Override
    default Phrase<V> visitVolumeAction(VolumeAction<Phrase<V>> volumeAction) {
        return ITransformerVisitor.super.visitVolumeAction(volumeAction);
    }

    @Override
    default Phrase<V> visitPlayNoteAction(PlayNoteAction<Phrase<V>> playNoteAction) {
        return ITransformerVisitor.super.visitPlayNoteAction(playNoteAction);
    }

    @Override
    default Phrase<V> visitToneAction(ToneAction<Phrase<V>> toneAction) {
        return ITransformerVisitor.super.visitToneAction(toneAction);
    }

    @Override
    default Phrase<V> visitPlayFileAction(PlayFileAction<Phrase<V>> playFileAction) {
        return ITransformerVisitor.super.visitPlayFileAction(playFileAction);
    }

    @Override
    default Phrase<V> visitLightAction(LightAction<Phrase<V>> lightAction) {
        return ITransformerVisitor.super.visitLightAction(lightAction);
    }

    @Override
    default Phrase<V> visitLightStatusAction(LightStatusAction<Phrase<V>> lightStatusAction) {
        return ITransformerVisitor.super.visitLightStatusAction(lightStatusAction);
    }

    @Override
    default Phrase<V> visitShowTextAction(ShowTextAction<Phrase<V>> showTextAction) {
        return ITransformerVisitor.super.visitShowTextAction(showTextAction);
    }

    @Override
    default Phrase<V> visitClearDisplayAction(ClearDisplayAction<Phrase<V>> clearDisplayAction) {
        return ITransformerVisitor.super.visitClearDisplayAction(clearDisplayAction);
    }
}
